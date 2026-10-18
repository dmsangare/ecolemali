import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DocumentTemplateCreateDto, DocumentGenerateDto } from "./dto";
import * as fs from "fs/promises";
import * as path from "path";

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly storageRoot = process.env.STORAGE_ROOT || "./storage";

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // TEMPLATES
  // ============================================================

  async findAllTemplates(schoolId: string | null, type?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (type) where.type = type;

    return this.prisma.documentTemplate.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { generated: true } } },
    });
  }

  async findTemplate(id: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
      include: { _count: { select: { generated: true } } },
    });
    if (!template) throw new NotFoundException("Modele introuvable");
    return template;
  }

  async createTemplate(dto: DocumentTemplateCreateDto) {
    const existing = await this.prisma.documentTemplate.findUnique({
      where: { schoolId_code: { schoolId: dto.schoolId, code: dto.code } },
    });
    if (existing) throw new BadRequestException("Un modele avec ce code existe deja");

    return this.prisma.documentTemplate.create({
      data: { ...dto, type: dto.type as any } as any,
    });
  }

  async updateTemplate(id: string, dto: Partial<DocumentTemplateCreateDto>) {
    await this.findTemplate(id);
    const data: any = { ...dto };
    if (dto.type) data.type = dto.type as any;
    return this.prisma.documentTemplate.update({ where: { id }, data });
  }

  async removeTemplate(id: string) {
    await this.findTemplate(id);
    return this.prisma.documentTemplate.delete({ where: { id } });
  }

  // ============================================================
  // GENERATION
  // ============================================================

  /**
   * Genere un document a partir d'un template.
   * Pour l'instant : retourne le HTML interpole.
   * Le PDF sera produit par le worker (Puppeteer).
   */
  async generate(dto: DocumentGenerateDto, generatedBy: string) {
    const template = await this.findTemplate(dto.templateId);

    if (!template.isActive) {
      throw new BadRequestException("Ce modele est desactive");
    }

    // Construire le contexte (donnees)
    const context: Record<string, any> = { ...dto.data };

    if (dto.studentId) {
      const student = await this.prisma.student.findUnique({
        where: { id: dto.studentId },
        include: {
          school: true,
          enrollments: {
            where: { status: "VALIDATED" },
            take: 1,
            orderBy: { enrollmentDate: "desc" },
            include: { class: true, level: true, academicYear: true },
          },
        },
      });
      if (!student) throw new NotFoundException("Eleve introuvable");
      context.student = student;
      context.school = student.school;
      if (student.enrollments[0]) {
        context.class = student.enrollments[0].class;
        context.level = student.enrollments[0].level;
        context.academicYear = student.enrollments[0].academicYear;
      }
    }

    if (!context.school) {
      context.school = await this.prisma.school.findUnique({ where: { id: template.schoolId } });
    }

    context.generatedAt = new Date();
    context.reference = dto.reference || `DOC-${Date.now()}`;

    // Interpoler le HTML (simple {{var}})
    const html = this.interpolate(template.htmlTemplate, context);

    // Sauvegarder le HTML dans le storage
    const fileName = `${template.code}-${context.reference}.html`;
    const filePath = path.join(this.storageRoot, "generated", fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, html, "utf-8");

    // Creer l'entree en base
    const generated = await this.prisma.generatedDocument.create({
      data: {
        templateId: dto.templateId,
        studentId: dto.studentId || null,
        reference: context.reference,
        fileUrl: `/api/v1/files/documents/${fileName}`,
        generatedBy,
      },
      include: {
        template: { select: { id: true, code: true, name: true, type: true } },
        student: { select: { id: true, matricule: true, firstName: true, lastName: true } },
      },
    });

    this.logger.log(`Generated document ${generated.id} from template ${template.code}`);

    return { ...generated, html };
  }

  async findAllGenerated(schoolId: string | null, page = 1, limit = 20, studentId?: string, templateId?: string) {
    const where: any = {};
    if (schoolId) where.template = { schoolId };
    if (studentId) where.studentId = studentId;
    if (templateId) where.templateId = templateId;

    const [data, total] = await Promise.all([
      this.prisma.generatedDocument.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { generatedAt: "desc" },
        include: {
          template: { select: { id: true, code: true, name: true, type: true } },
          student: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.generatedDocument.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findGenerated(id: string) {
    const doc = await this.prisma.generatedDocument.findUnique({
      where: { id },
      include: {
        template: true,
        student: true,
      },
    });
    if (!doc) throw new NotFoundException("Document genere introuvable");

    // Lire le HTML
    try {
      const fileName = path.basename(doc.fileUrl);
      const filePath = path.join(this.storageRoot, "generated", fileName);
      const html = await fs.readFile(filePath, "utf-8");
      return { ...doc, html };
    } catch {
      return doc;
    }
  }

  async removeGenerated(id: string) {
    await this.findGenerated(id);
    return this.prisma.generatedDocument.delete({ where: { id } });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private interpolate(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
      const value = key.split(".").reduce((acc: any, part: string) => acc?.[part], context);
      if (value === null || value === undefined) return "";
      if (value instanceof Date) {
        return value.toLocaleDateString("fr-FR", {
          day: "2-digit", month: "2-digit", year: "numeric",
        });
      }
      return String(value);
    });
  }
}

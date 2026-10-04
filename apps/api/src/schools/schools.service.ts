import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { SchoolCreateDto, SchoolUpdateDto } from "./dto";
import { promises as fs } from "fs";
import { join, extname } from "path";

@Injectable()
export class SchoolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findAll(page = 1, limit = 20, q?: string) {
    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { region: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.school.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        setting: true,
        _count: {
          select: {
            students: true,
            teachers: true,
            classes: true,
            academicYears: true,
          },
        },
      },
    });
    if (!school) throw new NotFoundException("Etablissement introuvable");
    return school;
  }

  async create(dto: SchoolCreateDto) {
    return this.prisma.school.create({ data: dto as any });
  }

  async update(id: string, dto: SchoolUpdateDto) {
    await this.findOne(id);
    return this.prisma.school.update({ where: { id }, data: dto as any });
  }

  async uploadLogo(id: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Aucun fichier fourni");
    }

    // Valider le type
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        "Format non supporte (PNG, JPG ou SVG uniquement)",
      );
    }

    // Valider la taille (2 Mo)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException("Fichier trop volumineux (max 2 Mo)");
    }

    await this.findOne(id);

    // Preparer le dossier de destination
    const storageRoot = this.config.get<string>("storage.root", "./storage");
    const logosDir = join(process.cwd(), storageRoot, "uploads", "logos");
    await fs.mkdir(logosDir, { recursive: true });

    // Nom de fichier unique
    const ext = extname(file.originalname) || ".png";
    const filename = `${id}-${Date.now()}${ext}`;
    const filepath = join(logosDir, filename);

    // Ecrire le fichier
    await fs.writeFile(filepath, file.buffer);

    // URL publique
    const logoUrl = `/uploads/logos/${filename}`;

    // Mettre a jour l'ecole
    return this.prisma.school.update({
      where: { id },
      data: { logoUrl },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.school.delete({ where: { id } });
  }
}

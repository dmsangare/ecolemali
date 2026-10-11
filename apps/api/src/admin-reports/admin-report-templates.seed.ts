import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Seed des 5 modèles internes par défaut (RAP-01).
 * Idempotent : ne recrée pas si déjà présent.
 * Aucune donnée officielle — clairement marqué MODELE_INTERNE.
 */
@Injectable()
export class AdminReportTemplatesSeed {
  private readonly logger = new Logger(AdminReportTemplatesSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly templates = [
    {
      code: 'RAP-02',
      title: 'Rapport de rentrée scolaire',
      category: 'RENTREE' as const,
      description:
        'Situation de l\'établissement au début de l\'année scolaire : identification, effectifs, classes ouvertes.',
      authorityTarget: 'CAP',
    },
    {
      code: 'RAP-03',
      title: 'Rapport statistique des effectifs',
      category: 'STATISTIQUES' as const,
      description:
        'États statistiques : effectifs par classe, niveau, cycle, sexe, redoublants.',
      authorityTarget: 'CAP',
    },
    {
      code: 'RAP-04',
      title: 'Rapport sur le personnel enseignant',
      category: 'PERSONNEL' as const,
      description:
        'Personnel enseignant et administratif : effectifs, répartition par matière et qualification.',
      authorityTarget: 'CAP',
    },
    {
      code: 'RAP-05',
      title: 'Rapport sur les infrastructures et équipements',
      category: 'INFRASTRUCTURES' as const,
      description:
        'Salles de classe, mobilier, équipements pédagogiques, état des locaux.',
      authorityTarget: 'CAP',
    },
    {
      code: 'RAP-06',
      title: 'Rapport annuel de situation morale, matérielle et pédagogique',
      category: 'SITUATION_ANNUELLE' as const,
      description:
        'Synthèse annuelle : situation administrative, pédagogique, matérielle, morale, perspectives.',
      authorityTarget: 'ACADEMIE',
    },
  ];

  /**
   * Insère les modèles internes globaux (schoolId = null).
   * Ne touche pas aux modèles déjà présents (par code + version).
   */
  async ensureGlobalTemplates(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const tpl of this.templates) {
      const existing = await this.prisma.adminReportTemplate.findFirst({
        where: {
          schoolId: null,
          code: tpl.code,
          version: 1,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await this.prisma.adminReportTemplate.create({
        data: {
          schoolId: null,
          code: tpl.code,
          title: tpl.title,
          description: tpl.description,
          category: tpl.category,
          status: 'MODELE_INTERNE',
          authorityTarget: tpl.authorityTarget,
          version: 1,
          isActive: true,
          configuration: {
            sections: this.getDefaultSections(tpl.code),
          },
        },
      });
      created++;
    }

    this.logger.log(
      `Admin report templates: ${created} créés, ${skipped} déjà présents`,
    );
    return { created, skipped };
  }

  private getDefaultSections(code: string): string[] {
    switch (code) {
      case 'RAP-02':
        return ['identification', 'effectifs', 'classes'];
      case 'RAP-03':
        return ['effectifs_par_classe', 'effectifs_par_niveau', 'repartition_sexe'];
      case 'RAP-04':
        return ['personnel_enseignant', 'personnel_administratif'];
      case 'RAP-05':
        return ['salles', 'mobilier', 'equipements'];
      case 'RAP-06':
        return ['administratif', 'pedagogique', 'materiel', 'moral', 'perspectives'];
      default:
        return [];
    }
  }
}

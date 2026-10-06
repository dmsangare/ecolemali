import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RoomCreateDto, RoomUpdateDto } from "./dto";
import { CurrentUserPayload } from "../common/decorators";
import { assertSchoolAccess } from "../common/utils";

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, type?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (type) where.type = type;

    return this.prisma.room.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { classes: true } } },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException("Salle introuvable");
    assertSchoolAccess(user, room.schoolId, "Salle introuvable");
    return room;
  }

  async create(dto: RoomCreateDto) {
    return this.prisma.room.create({ data: dto as any });
  }

  async update(id: string, dto: RoomUpdateDto, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.room.update({ where: { id }, data: dto as any });
  }

  async remove(id: string, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.room.delete({ where: { id } });
  }
}

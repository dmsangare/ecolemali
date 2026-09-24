import { IsOptional, IsString, IsBoolean, IsIn } from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class StudentListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  levelId?: string;

  @IsOptional()
  @IsString()
  @IsIn(["PREMIER_CYCLE", "DEUXIEME_CYCLE", "LYCEE"])
  cycle?: string;

  @IsOptional()
  @IsString()
  @IsIn(["M", "F"])
  gender?: string;

  @IsOptional()
  @IsString()
  @IsIn(["5-7", "8-10", "11-13", "14-16", "17+"])
  ageRange?: string;

  @IsOptional()
  @IsString()
  @IsIn(["ACTIVE", "TRANSFERRED", "GRADUATED", "DROPPED", "SUSPENDED"])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(["NOUVEAU", "ANCIEN", "REDOUBLANT"])
  enrollmentStatus?: "NOUVEAU" | "ANCIEN" | "REDOUBLANT";

  @IsOptional()
  @IsString()
  sortField?: string;

  @IsOptional()
  @IsString()
  @IsIn(["asc", "desc"])
  sortDirection?: "asc" | "desc";

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  onlyNew?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  onlyUnpaid?: boolean;
}

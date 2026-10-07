import { IsOptional, IsString, IsIn } from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class ExamListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsOptional()
  @IsString()
  termId?: string;

  @IsOptional()
  @IsString()
  @IsIn(["INTERNE", "COMPOSITION", "BLANC", "FIN_ANNEE"])
  type?: string;

  @IsOptional()
  @IsString()
  @IsIn(["PLANNED", "ONGOING", "FINISHED", "CANCELLED"])
  status?: string;
}

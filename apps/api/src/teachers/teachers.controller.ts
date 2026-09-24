import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TeachersService } from './teachers.service';

@Controller('teachers')
@UseGuards(JwtAuthGuard)
export class TeachersController {
  constructor(private service: TeachersService) {}

  @Get()
  findAll(@Req() req: any, @Query() query: any) {
    return this.service.findAll(req.user.schoolId, query);
  }

  @Get('subjects')
  getSubjects(@Req() req: any) {
    return this.service.getSubjects(req.user.schoolId);
  }

  @Get('classes')
  getClasses(@Req() req: any) {
    return this.service.getClasses(req.user.schoolId);
  }

  @Get('academic-years')
  getAcademicYears(@Req() req: any) {
    return this.service.getAcademicYears(req.user.schoolId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.schoolId, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: any) {
    return this.service.create(req.user.schoolId, dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(req.user.schoolId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.schoolId, id);
  }

  @Post(':id/assign')
  assign(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.assignSubject(req.user.schoolId, id, dto);
  }

  @Delete(':id/assign/:assignmentId')
  removeAssignment(
    @Req() req: any,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.service.removeAssignment(req.user.schoolId, id, assignmentId);
  }
}

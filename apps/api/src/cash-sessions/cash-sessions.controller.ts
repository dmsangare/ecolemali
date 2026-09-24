import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CashSessionsService } from './cash-sessions.service';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';

@Controller('cash-sessions')
@UseGuards(JwtAuthGuard)
export class CashSessionsController {
  constructor(private service: CashSessionsService) {}

  @Get('current')
  current(@Req() req: any) {
    return this.service.getCurrent(req.user.schoolId, req.user.id);
  }

  @Post('open')
  open(@Req() req: any, @Body() dto: OpenCashSessionDto) {
    return this.service.open(req.user.schoolId, req.user.id, dto);
  }

  @Post('close')
  close(@Req() req: any, @Body() dto: CloseCashSessionDto) {
    return this.service.close(req.user.schoolId, req.user.id, dto);
  }

  @Get('history')
  history(@Req() req: any, @Query() query: any) {
    return this.service.history(req.user.schoolId, query);
  }

  @Get(':id')
  detail(@Req() req: any, @Param('id') id: string) {
    return this.service.detail(req.user.schoolId, id);
  }
}

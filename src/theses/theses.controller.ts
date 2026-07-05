import {
  Body, Controller, Get, Param, ParseUUIDPipe,
  Post, Request, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AuthUser } from '../auth/strategies/jwt.strategy.js';
import { CreateThesisDto } from './dto/create-thesis.dto.js';
import { ThesesService } from './theses.service.js';

interface AuthRequest {
  user: AuthUser;
}

@Controller('theses')
export class ThesesController {
  constructor(private readonly theses: ThesesService) {}

  @Get()
  findPublic() {
    return this.theses.findPublic();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: AuthRequest) {
    return this.theses.findByOwner(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: Partial<AuthRequest>) {
    return this.theses.findOne(id, req.user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateThesisDto, @Request() req: AuthRequest) {
    return this.theses.create(dto, req.user.id);
  }
}

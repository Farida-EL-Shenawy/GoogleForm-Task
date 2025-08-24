import { Controller, Post, Body, Get, Param, Delete, Patch } from '@nestjs/common';
import { FormsService } from './forms.service';

@Controller('forms')
export class FormsController {
  constructor(private formsService: FormsService) { }

  @Post()
  createForm(@Body() body: any) {
    return this.formsService.createForm(body);
  }

  @Get()
  getAllForms() {
    return this.formsService.getAllForms();
  }

  @Get(':id')
  getForm(@Param('id') id: number) {
    return this.formsService.getForm(id);
  }

  @Post(':id/response')
  submitForm(@Param('id') id: number, @Body() body: any) {
    return this.formsService.submitFormResponse(id, body.responses, body.userId, body.guestName);
  }

  @Get(':id/responses')
  getResponses(@Param('id') id: number) {
    return this.formsService.getResponses(id);
  }

  @Patch(':id')
  updateForm(@Param('id') id: number, @Body() body: any) {
    return this.formsService.updateForm(id, body);
  }

  @Delete(':id')
  deleteForm(@Param('id') id: number) {
    return this.formsService.deleteForm(id);
  }

  @Post(':id/share')
  createShare(@Param('id') id: string, @Body() body: any) {
    return this.formsService.createShareLink(+id, body);
  }

}

@Controller('share')
export class ShareController {
  constructor(private formsService: FormsService) { }

  @Get(':code')
  getFormByCode(@Param('code') code: string) {
    return this.formsService.getFormByShareCode(code);
  }

  @Post(':code/response')
  submitByCode(@Param('code') code: string, @Body() body: any) {
    return this.formsService.submitByShareCode(
      code,
      body.responses,
      body.userId ?? null,
      body.guestName
    );
  }
}

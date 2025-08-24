import { ForbiddenException, GoneException, Injectable } from '@nestjs/common';
import { Form } from './form.entity';
import { Question } from './question.entity';
import { Response } from './response.entity';
import * as crypto from 'crypto';
import { ShareLink } from './share-link.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class FormsService {
  async createForm(body: { title: string; description?: string; questions: any[] }) {
    const { title, description, questions } = body;
    const form = await Form.create({ title, description }).save();

    for (const question of questions) {
      await Question.create({
        form,
        questionText: question.text,
        questionType: question.type,
        options: question.options || null,
      }).save();
    }

    return form;
  }

  async getAllForms() {
    return Form.find();
  }

  async getForm(formId: number) {
    const form = await Form.findOne({ where: { id: formId }, relations: ['questions'] });
    if (!form) throw new Error('Form not found');
    return form;
  }

  async getResponses(formId: number) {
    const responses = await Response.find({ where: { form: { id: formId } } });

    return Promise.all(
      responses.map(async (r) => {
        const answers = await Promise.all(
          r.responses.map(async (a) => {
            const question = await Question.findOne({ where: { id: a.questionId } });
            if (!question) return { question: 'Unknown', answer: a.answer };
            return { question: question.questionText, answer: a.answer };
          }),
        );
        return { ...r, responses: answers };
      }),
    );
  }

  async updateForm(formId: number, body: any) {
    const form = await Form.findOne({ where: { id: formId }, relations: ['questions'] });
    if (!form) throw new Error('Form not found');
    form.title = body.title ?? form.title;
    form.description = body.description ?? form.description;
    await form.save();

    if (body.questions && Array.isArray(body.questions)) {
      const existingQuestions = form.questions;
      for (const qBody of body.questions) {
        if (qBody.id) {
          const question = existingQuestions.find(q => q.id === qBody.id);
          if (question) {
            question.questionText = qBody.text ?? question.questionText;
            question.questionType = qBody.type ?? question.questionType;
            question.options = qBody.options ?? question.options;
            await question.save();
          }
        } else {
          const newQuestion = Question.create({
            form,
            questionText: qBody.text,
            questionType: qBody.type,
            options: qBody.options ?? null,
          });
          await newQuestion.save();
        }
      }
      const incomingIds = body.questions.map(q => q.id).filter(Boolean);
      for (const q of existingQuestions) {
        if (!incomingIds.includes(q.id)) {
          await q.remove();
        }
      }
    }
    return await Form.findOne({ where: { id: formId }, relations: ['questions'] });
  }


  async deleteForm(formId: number) {
    const form = await Form.findOne({ where: { id: formId } });
    if (!form) throw new Error('Form not found');

    await form.remove();
    return { message: 'Form deleted successfully' };
  }

  private genCode(len = 24) {
    const raw = crypto.randomBytes(Math.ceil(len * 0.75)).toString('base64url');
    return raw.slice(0, len);
  }

  async createShareLink(formId: number, body: any = {}) {
    const form = await Form.findOne({ where: { id: formId } });
    if (!form) throw new NotFoundException('Form not found');
    const expiresInMinutes =
      body.expiresInMinutes != null ? Number(body.expiresInMinutes) : undefined;
    const maxUses = body.maxUses != null ? Number(body.maxUses) : null;

    const code = this.genCode(24);
    const link = await ShareLink.create({
      code,
      form,
      expiresAt: expiresInMinutes ? new Date(Date.now() + expiresInMinutes * 60_000) : null,
      maxUses: maxUses ?? null,
      usedCount: 0,
      active: true,
    }).save();
    const FRONTEND_BASE = 'http://localhost:5173';
    const BACKEND_BASE = 'http://localhost:3000';

    return {
      code: link.code,
      shareUrl: `${FRONTEND_BASE}/s/${link.code}`,
      api: {
        getForm: `${BACKEND_BASE}/share/${link.code}`,
        submit: `${BACKEND_BASE}/share/${link.code}/response`,
      },
      expiresAt: link.expiresAt,
      maxUses: link.maxUses,
      active: link.active,
    };
  }

  async submitFormResponse(formId: number, responses: any[], userId: number | null, guestName?: string) {
    const questions = await Question.find({ where: { form: { id: formId } } });

    if (!Array.isArray(responses) || responses.length !== questions.length) {
      throw new BadRequestException('Responses count does not match questions.');
    }

    const answersWithQuestions = questions.map((q, i) => ({
      questionId: q.id,
      answer: responses[i],
    }));

    const response = await Response.create({
      form: { id: formId },
      responses: answersWithQuestions,
      userId: userId ?? null,
      guestName,
    }).save();

    return { message: 'Response submitted', response };
  }

  private ensureUsable(link: ShareLink) {
    if (!link.active) throw new ForbiddenException('Link disabled');
    if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('Link expired');
    }
    if (link.maxUses != null && link.usedCount >= link.maxUses) {
      throw new GoneException('Link already used');
    }
  }

  async getFormByShareCode(code: string) {
    const link = await ShareLink.findOne({ where: { code }, relations: ['form'] });
    if (!link) throw new NotFoundException('Invalid link');
    this.ensureUsable(link);

    const form = await Form.findOne({ where: { id: link.form.id }, relations: ['questions'] });
    if (!form) throw new NotFoundException('Form not found');
    return form; // same shape as GET /forms/:id
  }

  async submitByShareCode(code: string, responses: any[], userId?: number | null, guestName?: string) {
    const link = await ShareLink.findOne({ where: { code }, relations: ['form'] });
    if (!link) throw new NotFoundException('Invalid link');
    this.ensureUsable(link);

    const result = await this.submitFormResponse(link.form.id, responses, userId ?? null, guestName);

    if (link.maxUses != null) {
      link.usedCount += 1;
      await link.save();
    }
    return result;
  }
}

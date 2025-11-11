import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ActiveUserData {
  userId: string;
  sessionId: string;
}

export const ActiveUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ActiveUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as ActiveUserData;
  }
);

import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  uid!: string;

  @IsString()
  token!: string;
}

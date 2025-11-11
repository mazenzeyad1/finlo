import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryTransactionsDto {
  @IsOptional() @IsString() accountId?: string;
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsInt() @Min(1) page: number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(200) pageSize: number = 50;
}

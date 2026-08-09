import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FATokenDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  token: string;
}

export class VerifyLoginDto {
  @ApiProperty()
  @IsString()
  tempToken: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}

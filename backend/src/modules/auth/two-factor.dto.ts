import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FATokenDto {
  @ApiProperty({ description: 'The 6-digit TOTP verification code' })
  @IsString()
  token: string;
}

export class VerifyLoginDto {
  @ApiProperty()
  @IsString()
  tempToken: string;

  @ApiProperty({ description: 'The 2FA verification code' })
  @IsString()
  code: string;
}

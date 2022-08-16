import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginCallbackQueryDto {
  @ApiProperty({
    description: 'The code received from the spotify login server',
  })
  @IsString()
  @IsNotEmpty()
  public code: string;
}

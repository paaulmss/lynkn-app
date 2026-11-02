import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';
export class CreateNotificationDto {
  @IsInt() @Min(1) user_id!: number;
  @IsInt() @Min(1) sender_id!: number;
  @IsInt() @Min(1) post_id!: number;
  @IsIn(['join_request', 'accepted', 'rejected', 'info_pending'])
  type!: 'join_request' | 'accepted' | 'rejected' | 'info_pending';
  @IsOptional() @IsBoolean() is_read?: boolean;
}

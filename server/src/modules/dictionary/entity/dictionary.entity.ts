import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Dictionary {
  @PrimaryGeneratedColumn()
  _id: number;

  @Column({ comment: '回复内容'})
  message: string;

  @Column({ comment: '关键字'})
  keyWords: string;

  @Column({ default: '', comment: '词条类型' })
  type: string;

  @Column({type: 'double',default: new Date().valueOf()})
  createTime: number;
}

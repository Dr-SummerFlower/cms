import { Injectable } from '@nestjs/common';

/** 应用存活探针响应（不访问数据库等外部依赖）。 */
export type AppHealthStatus = {
  status: 'ok';
  uptime: number;
};

@Injectable()
export class AppService {
  getHealth(): AppHealthStatus {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
    };
  }
}

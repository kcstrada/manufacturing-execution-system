import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeedService } from './seed.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Seed');
  
  try {
    logger.log('Starting seed process...');
    
    const app = await NestFactory.createApplicationContext(AppModule);
    const seedService = app.get(SeedService);
    
    await seedService.seed();
    
    await app.close();
    logger.log('Seed process completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seed process failed', error);
    process.exit(1);
  }
}

bootstrap();
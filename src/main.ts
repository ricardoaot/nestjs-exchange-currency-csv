import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import * as os from 'os';

const cluster = require('cluster');

// Load environment variables from .env file
dotenv.config();

const numCPUs = os.cpus().length; // Get the number of CPU cores
const isClusteringEnabled = process.env.CLUSTER_ENABLED === 'true'; // Check if clustering is enabled

async function bootstrap() {
  // If clustering is enabled and the current process is the master
  if (isClusteringEnabled && cluster.isPrimary) {
    console.log(`CPUs: ${numCPUs}`);
    console.log(`Master ${process.pid} is running`);

    // Fork workers for each CPU core
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    // Listen for worker exit events
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
      // Optionally restart the worker if needed
      cluster.fork();
    });

    // Handle uncaught exceptions globally
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      // Optionally restart the worker if needed
      cluster.fork();
    });

    // Handle unhandled promise rejections globally
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Optionally restart the worker if needed
      cluster.fork();
    });

  } else {
    // Create the Nest application
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Configuration for serving static files
    app.useStaticAssets(join(__dirname, '..', 'src/public'));

    // Start listening on port 3000
    await app.listen(3000);
    console.log(`Worker ${process.pid} started`); // Log that the worker has started
  }
}

bootstrap();

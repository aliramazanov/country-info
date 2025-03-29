import { Logger } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export class DatabaseProvider {
  private static memoryServer: MongoMemoryServer | null = null;
  private static readonly logger = new Logger('MongoDB Provider');

  static async getMongoUri(): Promise<string> {
    const configuredUri = process.env.MONGODB_URI;

    if (configuredUri) {
      try {
        const mongooseInstance = await mongoose.connect(configuredUri);
        const db = mongooseInstance.connection.db;

        if (db) {
          await db.admin().ping();
          this.logger.log(`Connected to MongoDB: ${configuredUri}`);
          return configuredUri;
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        this.logger.warn(
          `Failed to connect to configured MongoDB: ${errorMessage}`,
        );

        this.logger.log('Getting back at in-memory MongoDB...');
      }
    }

    if (!this.memoryServer) {
      try {
        this.memoryServer = await MongoMemoryServer.create();
        const uri = this.memoryServer.getUri();
        this.logger.log(`In-memory MongoDB started: ${uri}`);

        try {
          const mongooseInstance = await mongoose.connect(uri);
          const db = mongooseInstance.connection.db;

          if (db) {
            const collections = await db
              .listCollections({ name: 'users' })
              .toArray();

            if (collections.length === 0) {
              const testUser = {
                _id: new mongoose.Types.ObjectId('644a612a1fe93a876543210f'),
                name: 'Test User',
                email: 'test@example.com',
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              await db.collection('users').insertOne(testUser);

              this.logger.log(
                'Created test user with ID: 644a612a1fe93a876543210f',
              );
            }
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          this.logger.error(`Failed to create test user: ${errorMessage}`);
        }

        return uri;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        this.logger.error(
          `Failed to create in-memory MongoDB: ${errorMessage}`,
        );
      }
    }

    if (this.memoryServer) {
      return this.memoryServer.getUri();
    }

    return 'mongodb://127.0.0.1:27017/country-info-app';
  }

  static async cleanupDatabase(): Promise<void> {
    if (this.memoryServer) {
      try {
        await mongoose.disconnect();
        await this.memoryServer.stop();

        this.memoryServer = null;

        this.logger.log('In-memory MongoDB server stopped');
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        this.logger.error(`Error during cleanup: ${errorMessage}`);
      }
    }
  }
}

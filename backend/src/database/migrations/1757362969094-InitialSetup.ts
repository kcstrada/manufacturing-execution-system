import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSetup1757362969094 implements MigrationInterface {

    public async up(_queryRunner: QueryRunner): Promise<void> {
        // Initial setup - no operations needed
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Initial setup - no operations needed
    }

}

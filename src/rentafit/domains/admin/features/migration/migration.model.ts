export interface MigrationFile {
    name: string;
    size: number;
    type: string;
    status: string;
    error?: string;
}

export interface MigrationSession {
    id: string;
    createdAt: string;
    status: string;
    files: MigrationFile[];
    report?: MigrationReport;
}

export interface MigrationReport {
    startedAt: string;
    finishedAt: string;
    status: string;
    customersMigrated: number;
    employeesMigrated: number;
    categoriesMigrated: number;
    rentalItemsMigrated: number;
    contractsMigrated: number;
    errors: string[];
    warnings: string[];
}

export interface MigrationComparison {
    equal: boolean;
    tables: TableComparison[];
}

export interface TableComparison {
    tableName: string;
    originalCount: number;
    dumpCount: number;
    difference: number;
}

/**
 * One-shot verification that the Academy tables + unique index landed.
 * Run: npx tsx scripts/check-academy-schema.ts   (safe: read-only queries)
 */
import { initDb, getPool, closeDb } from "../src/db/pool";

async function main(): Promise<void> {
  await initDb();
  const p = getPool();
  const cols = await p.request().query(`
    SELECT t.name AS tbl, c.name AS col, ty.name AS type, c.max_length, c.is_nullable
    FROM sys.tables t
    JOIN sys.columns c ON c.object_id = t.object_id
    JOIN sys.types ty ON ty.user_type_id = c.user_type_id
    WHERE t.name IN ('AcademyLessonProgress','AcademyQuizAttempts')
    ORDER BY t.name, c.column_id`);
  const idx = await p.request().query(`
    SELECT t.name AS tbl, i.name AS idx, i.is_unique
    FROM sys.indexes i JOIN sys.tables t ON t.object_id = i.object_id
    WHERE t.name IN ('AcademyLessonProgress','AcademyQuizAttempts') AND i.name IS NOT NULL
    ORDER BY t.name, i.name`);
  const fks = await p.request().query(`
    SELECT fk.name AS fk, OBJECT_NAME(fk.parent_object_id) AS tbl
    FROM sys.foreign_keys fk
    WHERE OBJECT_NAME(fk.parent_object_id) IN ('AcademyLessonProgress','AcademyQuizAttempts')`);
  console.log("COLUMNS:");
  for (const r of cols.recordset) console.log(` ${r.tbl}.${r.col} ${r.type}${r.is_nullable ? " NULL" : " NOT NULL"}`);
  console.log("INDEXES:");
  for (const r of idx.recordset) console.log(` ${r.tbl}: ${r.idx} unique=${r.is_unique}`);
  console.log("FOREIGN KEYS:");
  for (const r of fks.recordset) console.log(` ${r.tbl}: ${r.fk}`);
  await closeDb();
}
void main();

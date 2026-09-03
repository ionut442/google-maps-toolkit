import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredObjectMetadata = { sizeBytes: number; modifiedAt: Date };
export interface PrivateObjectStorage {
  store(objectKey: string, bytes: Uint8Array): Promise<void>;
  read(objectKey: string): Promise<Uint8Array>;
  delete(objectKey: string): Promise<void>;
  metadata(objectKey: string): Promise<StoredObjectMetadata>;
}

const SAFE_OBJECT_KEY = /^[a-z0-9][a-z0-9/_-]*\.(jpg|png|webp|pdf)$/;
const NEON_UPLOADS_BUCKET = "uploads";

function validateObjectKey(objectKey: string) {
  if (!SAFE_OBJECT_KEY.test(objectKey) || objectKey.includes(".."))
    throw new Error("Invalid private object key");
}

function contentTypeForKey(objectKey: string) {
  if (objectKey.endsWith(".jpg")) return "image/jpeg";
  if (objectKey.endsWith(".png")) return "image/png";
  if (objectKey.endsWith(".webp")) return "image/webp";
  if (objectKey.endsWith(".pdf")) return "application/pdf";
  throw new Error("Invalid private object key");
}

export class LocalPrivateStorage implements PrivateObjectStorage {
  readonly root: string;

  constructor(
    root = process.env.PRIVATE_STORAGE_DIR ??
      path.join(process.cwd(), ".local-data", "private"),
  ) {
    this.root = path.resolve(root);
  }

  private resolve(objectKey: string) {
    validateObjectKey(objectKey);
    const target = path.resolve(this.root, objectKey);
    if (!target.startsWith(`${this.root}${path.sep}`))
      throw new Error("Private object path escaped storage root");
    return target;
  }

  async store(objectKey: string, bytes: Uint8Array) {
    const target = this.resolve(objectKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes, { flag: "wx" });
  }

  async read(objectKey: string) {
    return new Uint8Array(await readFile(this.resolve(objectKey)));
  }

  async delete(objectKey: string) {
    await rm(this.resolve(objectKey), { force: true });
  }

  async metadata(objectKey: string) {
    const value = await stat(this.resolve(objectKey));
    return { sizeBytes: value.size, modifiedAt: value.mtime };
  }
}

export class NeonPrivateStorage implements PrivateObjectStorage {
  constructor(
    private readonly client = new S3Client({ forcePathStyle: true }),
    private readonly bucket = NEON_UPLOADS_BUCKET,
  ) {}

  async store(objectKey: string, bytes: Uint8Array) {
    validateObjectKey(objectKey);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: bytes,
        ContentLength: bytes.byteLength,
        ContentType: contentTypeForKey(objectKey),
        IfNoneMatch: "*",
      }),
    );
  }

  async read(objectKey: string) {
    validateObjectKey(objectKey);
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
    if (!result.Body) throw new Error("Private object body was empty");
    return new Uint8Array(await result.Body.transformToByteArray());
  }

  async delete(objectKey: string) {
    validateObjectKey(objectKey);
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
  }

  async metadata(objectKey: string) {
    validateObjectKey(objectKey);
    const result = await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
    if (result.ContentLength === undefined || !result.LastModified)
      throw new Error("Private object metadata was incomplete");
    return {
      sizeBytes: result.ContentLength,
      modifiedAt: result.LastModified,
    };
  }
}

export function configuredPrivateStorage(
  env: Record<string, string | undefined> = process.env,
): PrivateObjectStorage {
  const production = env.NODE_ENV === "production";
  const provider =
    env.PRIVATE_STORAGE_PROVIDER ?? (production ? "neon" : "local");
  if (provider === "local" && !production)
    return new LocalPrivateStorage(env.PRIVATE_STORAGE_DIR);
  if (provider === "neon") return new NeonPrivateStorage();
  throw new Error("Private storage provider is unavailable");
}

export const privateStorage = configuredPrivateStorage();

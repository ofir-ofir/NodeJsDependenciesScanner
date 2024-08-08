import {z} from "zod";

export const packageJsonSchema = z.object({
    version: z.string(),
    name: z.string(),
    dependencies: z.record(z.string()),
    devDependencies: z.record(z.string()).optional()
}).passthrough()

export type PackageJson = z.infer<typeof packageJsonSchema>

export const npmGetPackageDataSchema = z.object({
    name: z.string(),
    ["dist-tags"]: z.record(z.string()),
    versions: z.record(z.string(), z.object({
        deprecated: z.string().optional()
    }).passthrough()),
}).passthrough()

export type NpmPackageData = z.infer<typeof npmGetPackageDataSchema>

export const packageVersionRegex = /((\d+)\.\d+\.\d+)/

export const npmRegistryUrl = `https://registry.npmjs.org`
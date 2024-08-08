import * as fs from "fs"
import {AxiosStatic} from "axios"
import {
    npmGetPackageDataSchema,
    NpmPackageData,
    npmRegistryUrl,
    PackageJson,
    packageJsonSchema,
    packageVersionRegex
} from "./VersionScannerConsts";

type ReadFileFunc = (path: fs.PathOrFileDescriptor, options: any) => string

export class VersionsScanner {
    constructor(private httpClient: AxiosStatic, private readFileFunc: ReadFileFunc = fs.readFileSync) {
    }

    public async ScanForVersionsWithAdvancedMajor(projectPath: string, ignoreList: string[]): Promise<void> {
        const packageJsonContent = this.getPackageJsonContent(projectPath)

        await Promise.all(Object.entries(packageJsonContent.dependencies)
            .filter(([d, _v]) => !ignoreList.some((i) => d.includes(i)))
            .map(async ([packageName, packageVersion]) => {
                const npmPackageData = await this.getPackageLatestVersion(packageName)
                const latestVersion = npmPackageData["dist-tags"].latest
                const currentVersionMajor = this.extractMajorFromVersion(packageVersion)
                const latestVersionMajor = this.extractMajorFromVersion(latestVersion)

                if (latestVersionMajor > currentVersionMajor) {
                    console.log(`Package ${packageName} has a new major version. current: ${packageVersion}, latest: ${latestVersion}`)
                }
            })
        )
    }

    public async ScanForDeprecatedPackages(projectPath: string, ignoreList: string[]): Promise<void> {
        const packageJsonContent = this.getPackageJsonContent(projectPath)

        await Promise.all(Object.entries(packageJsonContent.dependencies)
            .filter(([d, _v]) => !ignoreList.some((i) => d.includes(i)))
            .map(async ([packageName, packageVersion]) => {
                const npmPackageData = await this.getPackageLatestVersion(packageName)
                this.logIfDeprecated(packageVersion, npmPackageData)
            })
        )
    }

    private logIfDeprecated(packageVersion: string, npmPackageData: NpmPackageData) {
        const rawPackageVersion = packageVersion.replace(/[\^@~]/, "");
        console.log(rawPackageVersion)
        if (npmPackageData.versions[rawPackageVersion]?.deprecated) {
            console.log(`Package ${npmPackageData.name} is deprecated. version: ${packageVersion}`)
        }
    }

    private async getPackageLatestVersion(packageName: string): Promise<NpmPackageData> {
        const axiosResponse = await this.httpClient.get(`${npmRegistryUrl}/${packageName}`)
        const safeParseResult = npmGetPackageDataSchema.safeParse(axiosResponse.data)
        if (!safeParseResult.success) {
            throw new Error(`Failed to parse npm response. error: ${safeParseResult.error}`)
        }

        return safeParseResult.data
    }

    private extractMajorFromVersion(packageVersion: string): number {
        const matchedVersionParts = packageVersionRegex.exec(packageVersion)
        if (!matchedVersionParts) {
            throw new Error(`Invalid version format. version: ${packageVersion}`)
        }
        return parseInt(matchedVersionParts[2])
    }

    private getPackageJsonContent(projectPath: string): PackageJson {
        const packageJsonPath = `${projectPath}/package.json`
        const fileContent = this.readFileFunc(packageJsonPath, 'utf8')
        const safeParseResult = packageJsonSchema.safeParse(JSON.parse(fileContent))
        if (!safeParseResult.success) {
            throw new Error(`Invalid package.json file. path: ${projectPath}. error: ${safeParseResult.error}`)
        }

        return safeParseResult.data
    }
}
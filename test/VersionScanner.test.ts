import {describe, test, vi, expect} from 'vitest'
import {VersionsScanner} from "../src/VersionsScanner";
import axios from "axios";
import {NpmPackageData, PackageJson} from "../src/VersionScannerConsts";
import {MockProxy} from "vitest-mock-extended";

describe('VersionScanner', () => {

    function givenFakePackageJsonContent(): PackageJson {
        return {
            name: 'foo',
            version: '1.0.0',
            dependencies: {
                'bar': '1.0.0'
            }
        }
    }

    function givenConsoleLogMock(): MockProxy<typeof console.log> {
        const loggerFunc = vi.fn()
        console.log = loggerFunc
        return loggerFunc;
    }

    describe('ScanForVersionsWithAdvancedMajor', () => {
        test('given a package for which there is a newer major version, a log should be made', async () => {
            axios.get = vi.fn().mockResolvedValue({data: {name: "bar", "dist-tags": {latest: "2.0.0"}, versions: {}}})

            const packageJsonFileContent = givenFakePackageJsonContent();
            const readFileFunc = vi.fn().mockReturnValue(JSON.stringify(packageJsonFileContent))
            const loggerFunc = givenConsoleLogMock();

            const versionsScanner = new VersionsScanner(axios, readFileFunc);
            await versionsScanner.ScanForVersionsWithAdvancedMajor('fake-path', [])
            expect(loggerFunc).toHaveBeenCalledWith('Package bar has a new major version. current: 1.0.0, latest: 2.0.0')
        })
    })

    describe('ScanForDeprecatedPackages', () => {
        function givenNpmPackageResponseWithDeprecatedVersion(): NpmPackageData {
            return {
                name: "bar",
                "dist-tags": {
                    latest: "2.0.0"
                },
                versions: {
                    "1.0.0": {
                        deprecated: 'this version is deprecated'
                    }
                }
            }
        }

        test('given a deprecated package, a log should be made', async () => {
            axios.get = vi.fn().mockResolvedValue({data: givenNpmPackageResponseWithDeprecatedVersion()})

            const packageJsonFileContent = givenFakePackageJsonContent()
            const readFileFunc = vi.fn().mockReturnValue(JSON.stringify(packageJsonFileContent))
            const loggerFunc = givenConsoleLogMock();

            const versionsScanner = new VersionsScanner(axios, readFileFunc);
            await versionsScanner.ScanForDeprecatedPackages('fake-path', [])
            expect(loggerFunc).toHaveBeenCalledWith('Package bar is deprecated. version: 1.0.0')
        })
    })
})
import {VersionsScanner} from "./src/VersionsScanner";
import axios from "axios";

function main() {
    const projectPath = '/Users/ofirtziter/Mitiga/services'
    const versionsScanner = new VersionsScanner(axios);

    const ignoreList = ['@mitigacloud']
    versionsScanner.ScanForVersionsWithAdvancedMajor(projectPath, ignoreList)
    versionsScanner.ScanForDeprecatedPackages(projectPath, ignoreList)
}

main()
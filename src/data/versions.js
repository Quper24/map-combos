import VERSIONS from '../../content/versions.json';
import site from '../../content/site.json';
export { VERSIONS };
export const getCurrentVersion = () => VERSIONS[site.currentGameVersion];
export const getDefaultVersion = getCurrentVersion;

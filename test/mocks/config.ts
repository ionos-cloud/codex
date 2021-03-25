import config from '../../src/services/config'

const dir = 'config'
const defaultConfigMock = {
  authUrl: 'https://dashboard.platform.ionos.org/gph--service-auth',
  lockUrl: 'https://dashboard.platform.ionos.org/gph--service-lock',
  auth: {
    username: 'foobar',
    token: ''
  },
  s3: {
    endpoint: 's3-de-central.profitbricks.com',
    region: 'de',
    key: 'foo',
    secret: 'bar',
    bucket: 'codex'
  }
}

const mockFs = (cfg: Record<string, any>): Record<string, any> => ({
  [config.getConfigFileName(dir)]: JSON.stringify(cfg)
})
const defaultMock = mockFs(defaultConfigMock)

export { dir, mockFs, defaultMock, defaultConfigMock }

export const Vpc = new sst.aws.Vpc('Vpc', { bastion: true, nat: 'ec2' })
export const Postgres = new sst.aws.Postgres('Postgres', {
  vpc: Vpc,
  proxy: true,
})

export const resources = {
  Host: Postgres.host,
  Database: Postgres.database,
}

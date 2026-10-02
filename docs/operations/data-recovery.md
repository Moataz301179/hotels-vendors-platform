# Data Backup & Recovery

Production uses Neon/PostgreSQL. Recovery is a release gate, not a checkbox.

Required evidence before declaring recovery ready:

- a current backup exists;
- a restore target is available;
- restore has been executed in a non-production environment;
- schema/migration compatibility is verified;
- critical business records are queryable after restore;
- the recovery procedure is timestamped and retained.

A backup that has never been restored is not proven recovery.

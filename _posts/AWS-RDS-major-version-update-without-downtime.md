---
layout: post
title:  "AWS RDS major version update with zero downtime"
author: GG & Bharat
categories: [ AWS, Technology ]
tags: [AWS, Technology]
image: assets/images/7targets-integration-salesforce.png
# beforetoc: "Prism highlighter is a very powerful thing."
# toc: true
description: "Update the AWS RDS major version without any dowmtime"
# rating: 4.5
---

We needed to upgrade the AWS RDS Aurora MySQL from 5.6 to 5.7 without causing any downtime to our production. Our being a SaaS solution, we could not afford any downtime.  

![image](../assets/images/7targets-all-integrations.png)

## Background
Our application is running on ECS fargate and we have Aurora MySQLversion 5.6

## Approach
We will be using AWS DMS(Data Migration Service) for upgrading major versions. After that we will point out application endpoint to use our new database:
lets discuss the step one by one
1. Take the Snapshot of the Aurora MySQL 5.6 Cluster, we will need it when thinks not work as expected.
2. Change the parameter group value of your Original cluster(Mysql 5.6) and if you are using default parameter group then create new one
   set binlog_format= ROW. The parameter is only effective after a reboot, so overnight we rebooted the node. That was a first short downtime.
3. Since our procedure involves a logical backup and restore, we had to make sure the binary log files are kept for a long enough time. With a regular MySQL server the variable “expire_logs_days” controls the binary log files retention time. With RDS, you have to use the mysql.rds_set_configuration. We set it for 3 days. You can choose whatever days you want.
  CALL mysql.rds_set_configuration('binlog retention hours', 64);
  CALL mysql.rds_show_configuration;
4. Check the log_bin value. If it is off, set it to on. 
   SET GLOBAL log_bin = ON;
5. Now create new Aurora mysql 5.7 cluster Do same configuration as we did for MySQL 5.6 in new Aurora 5.7 cluster
6. Now we can spin up a new DMS cluster but befour that we would look at the limitation of AWS DMS. There are many limitation, the one we encountered was "The AUTO_INCREMENT attribute on a column isn't migrated to a target database column". you can check the limitation here https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.MySQL.html
7. So we created the dump of the schema  and restore the dump to the new cluster
   mysqldump -h yourhostnameorIP -u root -p --no-data dbname > schema.sql
   Now create new database in the new cluster with the same name as original
   Now run mysql -h yourhostnameorIP -u root -p  dbname < schema.sql
8. Now schema is dumped, lets create DMS.
9. We will we creating Source and Target Endpoint first and then we will create DMS instance and DMS task.
10. If you don't know how to create DMS task, check out this document to get started with DMS https://docs.aws.amazon.com/dms/latest/userguide/CHAP_GettingStarted.html
11. When creating DMS task use 
    Target table preparation mode - Do nothing
    Enable validation
    Enable CloudWatch logs
    Enable premigration assessment run
    In selections rule write the name of the database that you want to restore
12. Ones done with all step start the replication process
13. Ones full load is completed and ongoing replication is going on, think of a time where you can change the endpoint of your application to new Aurora 5.7 cluster, but befor that check the count of all the tables in the new cluster and compare it with the original cluster, if some counts are missing then use Reloading tables during a task for more info please see https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Tasks.ReloadTables.html
14. If counts of tables are equal then we are good to more forward to next step
15. In our case we were using ECS fragate behind a load balancer, So when there was no load at our application we changed the DB endpoint, so a new ECS task starts, as soon as the task become healthy in tagret group we deregistered the old target group so that all the new request of DB will go through the new target
16. We keep the Old DB for 1 day so that if any problem accour we can rollback to the previous DB 
17. By this we do the major version upgrade with zaero down time

## Outcome


---
layout: post
title:  "Update AWS RDS major version with zero downtime"
author: Bharat
categories: [ AWS, Tech ]
tags: [AWS, Tech]
image: assets/images/zero-downtime.png
# beforetoc: "Prism highlighter is a very powerful thing."
# toc: true
description: "Update the AWS RDS major version with zero downtime"
# rating: 4.5
---

Need was to upgrade the AWS RDS Aurora MySQL from 5.6 to 5.7 without causing any downtime to our production. Being a SaaS solution, we could not afford any downtime.  

## Background
We have distributed architecture based on micro services running in AWS Fargate and AWS Lambda. For data persistency AWS RDS Aurora MySQL is used. While there are other services being used, those are not of interest in this use-case. 

## Approach
After a good deliberation on in place upgrade by declaring a downtime and maintenance window, we realized that having zero downtime upgrade is the need. As without which we would have created a processing backlog for us. 
High level approach was:
1. Create an AWS RDS Cluster with the required version and copy the data from existing RDS Cluster to this new Cluster
1. Setup AWS DMS(Data Migration Service) between these two clusters
1. Once the replication is done and is ongoing then switch the application to point to the new DB. In our case the micro-services running in AWS Fargate has to upgraded with the new end point and it took care of draining the old and using the new. 

## Exact steps and process we followed:
There are some specific aspects to be careful about and are mentioned below. 

1. Take a Snapshot of the existing RDS cluser, we may need it as a backup, just in case.
1. set binlog_format = ROW, in the parameter group of existing RDS cluster(Mysql 5.6). The will need RDS reboot. That was the only short downtime.
1. Since our procedure involves a logical backup and restore, we had to make sure the binary log files are kept for a enough time. With a regular MySQL server, the variable “expire_logs_days” controls the binary log files retention time. With RDS, you have to use the mysql.rds_set_configuration. We set it for 3 days. You can choose based on your data size and accumulation.
> CALL mysql.rds_set_configuration('binlog retention hours', 64);  
> CALL mysql.rds_show_configuration;
1. Set the log_bin value on if it is off. 
> SET GLOBAL log_bin = ON;
1. Now create a new RDS Aurora MySQL 5.7 cluster. Do the same configuration as we did for MySQL 5.6 in the newly created cluster
1. Now we can setup DMS, but before that note the limitations of AWS DMS. There are many, the one we encountered was __the AUTO_INCREMENT attribute on a column isn't migrated to a target database column__. You can check the details at [AWS DMS](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.MySQL.html){:target="_blank"} 
7. We created the dump of the existing  RDS and restored the dump to the new RDS cluster
> mysqldump -h yourhostnameorIP -u root -p --no-data dbname > schema.sql  
> mysql -h yourhostnameorIP -u root -p  dbname < schema.sql  
1. With the DB and data created in the new RDS Cluster, let's setup DMS.
1. We created Source and Target Endpoint and then the [DMS instance and DMS task](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_GettingStarted.html){:target="_blank"}
1. When creating DMS task, note below settings: 
> Target table preparation mode - Do nothing  
> Enable validation  
> Enable CloudWatch logs  
> Enable premigration assessment run  
1. Once above configuration for DMS is done, started the replication process
1. After full initial load is migrated and ongoing replication is going on, think of a time where you can change the endpoint of your application to the new RDS cluster. But before that check the count of all the tables in the new cluster and compare it with the original cluster. If some counts are not matching then reload tables in DMS. We faced this issue of some tables haven't got the complete data and reload fixed tables fixed it. This is very critical step before the applications starts using the new RDS Cluster. More info at (https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Tasks.ReloadTables.html){:target="_blank"}
1. With ECS Fargate behind a load balancer, we started  a new ECS task with the application now pointing to the new RDS. As soon as the new task became healthy in the target group, we deregistered the old target from the target group so that all the new request of DB will go through the new target.
1. Done, the major version upgrade from 5.6 to 5.7 for RDS Aurora MySQL was achieved with close to zero downtime. Only downtime was the DB Restart for the config change. 

Hope this helps you. You can drop an email to info@7targets.com if any questions.




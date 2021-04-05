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
1. Change the parameter group value of your Original cluster(Mysql 5.6) and id you are using default parameter group then create new one
   set binlog_format= ROW
2. 
3. We will create new Aurora mysql 5.7 cluster
4. As there are many limitation of AWS DMS
5. We will create DMS task, if you don't know how to create DMS task, check out this document to get started with DMS https://docs.aws.amazon.com/dms/latest/userguide/CHAP_GettingStarted.html
6. We will we creating Source and Target Endpoint first and then we will create DMS instance and DMS task.
7.

## Outcome


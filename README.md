# Form Toolbox 🛠️

Form Toolbox simplifies and automates the process of entering and validating physical forms that have been digitized, saving time, increasing accuracy, and lowering business costs. Its architecture focuses on practicality and adaptability, using Docker containers for consistent and manageable deployment, Terraform for efficient and reliable orchestration of AWS resources, and AWS services to contextually extract data and securely store form artifacts and metadata. A unique namespace is utilized within Terraform to ensure that it can co-exist with other resources while also being easily identifiable.

In the future, Form Toolbox can be extended to provide contextual analysis, and verification of expected data.

## Example Workflow

https://github.com/user-attachments/assets/b9f753c2-2fba-4944-860c-32cc188be738

# Local Development

## Prerequisites

- AWS Account
- docker
- terraform cli

## Setting Up

To run a development build, which includes hot-reloading for the Docker portion:

1. Create `./terraform/terraform.tfvars`, populating `region`  with your AWS region
2. Run each following command from the `./terraform/` directory:
```
terraform init
terraform validate
terraform plan
terraform apply
```
3. Note outputted values from running `terraform apply` above:
```
AWS_BUCKET_NAME
AWS_REGION
AWS_SQS_QUEUE_NAME
COMPOSE_PROJECT_NAME
```
4. Create `./.env`, populating with above and appropriate values.
5. Run each following command:
```
docker compose build
docker compose up -d
```

## Tearing Down

When no longer needed, run each following command:

```
docker compose down
terraform destroy
```

# Notes

- `AWS_SQS_REQUEUE_DELAY` is in seconds
- `docker-compose.yaml` will eventually be renamed to `docker-compose-dev.yaml`, and `docker-compose.yaml` will be utilized for non-dev builds. This is to ease current development (requiring less typing) and architectural flexibilty.

# Application Architecture

Form Toolbox harnesses Docker for flexible and reliable deployment, and integrates with AWS for enhanced data processing and storage capabilities. The architecture weaves together modern web technologies and a highly-available and redundant backend framework to provide a seamless and performant user experience.

- **User**: Interacts with Form Toolbox to upload new forms and utilize resulting analysis.
- **Docker Environment**: Encapsulates the application components (Web Server, API, Database) in containers, facilitating consistent deployment and scalability.
- **Frontend - React with Hooks**: Serves as the frontend, handling user interactions and relaying requests to the API.
- **API - Node Express**: Backend server that processes requests, manages business logic, and interfaces with the database and AWS services.
- **ORM - Sequelize**: Facilitates communication between the API and the database, ensuring data consistency and simplifying database interactions.
- **Database - PostgreSQL**: Stores application data using PostgreSQL, leveraging Sequelize for object-relational mapping and incorporating JSONB for flexible schema representation.
- **AWS Services**: Provides cloud infrastructure for storage (S3), serverless computing (Lambda), form analysis (Textract), notifications (SNS), and message queuing (SQS).


```mermaid
graph LR
    subgraph FormToolbox["Form Toolbox (via Docker)"]
        Frontend <--> API{API}
        API <--"ORM"--> DB[(Database)]
    end

    User(("User")) <--> Frontend
    API <--> AWS{{"AWS Services"}}
```

# AWS Integration Diagram

Form Toolbox integrates AWS services, orchestrated through Terraform, to enhance form data processing and secure storage. This integration is pivotal in automating the extraction and analysis of key-value data from digitized forms.

- **User**: (see above)
- **Form Toolbox**: Acts as the central hub, including a frontend, API, and database. Receives form image from the user, initiates textraction, and polls AWS for raw analysis. Transforms analysis into contextual data.
- **AWS S3**: Stores forms, form thumbnails, metadata, and raw analysis. Triggers a Lambda function when new forms are uploaded.
- **AWS Lambda**: Retrieves metadata from S3 object, initiates Textract analysis, and informs SQS that analysis has started, including the related Textract ID.
- **AWS Textract**: Extracts key-value data from forms.
- **AWS SNS**: Notifies SQS when Textract has completed its analysis. Note that Textract cannot notify SQS directly.
- **AWS SQS**: Receives messages about the status of form processing, such as analysis start and completion. Form Toolbox polls the queue and then transforms the analysis.

```mermaid
graph TD
  User(("User")) --"Uploads"--> FormToolbox{{"Form Toolbox"}}
  FormToolbox --"Interacts"--> User
  FormToolbox --"Uploads"--> AWS_S3["AWS S3"]
  AWS_S3 --"Triggers"--> AWS_Lambda["AWS Lambda"]
  AWS_Lambda --"Gets Metadata"--> AWS_S3
  AWS_Lambda--"Messages"--> AWS_SQS
  AWS_Lambda --"Initiates"--> AWS_Textract["AWS Textract"]
  AWS_Textract --"Notifies"--> AWS_SNS["AWS SNS"]
  AWS_SNS --"Messages"--> AWS_SQS["AWS SQS"]
  AWS_SQS --"When Polled"--> FormToolbox
```

*Note: within Mermaid markup, it does not appear possible at this time to render "AWS" as a subgraph and retain the intended flow/shape.*

# Azure Integration Diagram

Form Toolbox can be implemented using Azure-native services while preserving the same architectural intent: event-driven form ingestion, durable processing, and asynchronous extraction of structured data from scanned documents.

This Azure approach emphasizes managed integration, event orchestration, and enterprise durability, while remaining conceptually aligned with the AWS implementation.

- **User**: (see above)
- **Form Toolbox**: Central application stack (frontend, API, database). Uploads forms, initiates analysis, and transforms extracted results into contextual data.
- **Azure Blob Storage**: Stores uploaded forms, thumbnails, metadata, and raw analysis output. Emits events when new blobs are created.
- **Azure Event Grid**: Receives blob creation events and routes them to downstream compute.
- Azure Functions: Serverless compute that retrieves metadata, initiates document analysis, and emits processing state messages.
- Azure AI Document Intelligence (Form Recognizer): Extracts structured key-value pairs, tables, and fields from forms.
- Azure Service Bus (Topic / Queue): Provides durable messaging for processing state (analysis started / completed), including dead-letter handling.
- Form Toolbox Poller / Listener: Polls or subscribes to Service Bus messages to retrieve analysis results and finalize transformation.

```mermaid
graph TD
  User(("User")) --"Uploads"--> FormToolbox{{"Form Toolbox"}}
  FormToolbox --"Interacts"--> User

  FormToolbox --"Uploads"--> Azure_Blob["Azure Blob Storage"]
  Azure_Blob --"Blob Created Event"--> Azure_EventGrid["Azure Event Grid"]

  Azure_EventGrid --"Triggers"--> Azure_Function["Azure Function"]
  Azure_Function --"Gets Metadata"--> Azure_Blob

  Azure_Function --"Initiates"--> Azure_DocumentAI["Azure AI Document Intelligence"]
  Azure_DocumentAI --"Analysis Complete:<br />Messages"--> Azure_ServiceBus

  Azure_Function --"Messages"--> Azure_ServiceBus["Azure Service Bus"]
  Azure_ServiceBus --"When Polled / Subscribed"--> FormToolbox
```

# Database Diagram

To balance the diverse requirements of various templates (types of forms) with the need for strict schema and ACID compliance, Form Toolbox employs a hyrid approach. Utilizing PostgreSQL's JSONB datatype, each template has its own schema, while still maintaining a consistent, overarching schema-based system. This methodology effectively merges the benefits of NoSQL/Document storage – flexibility and adaptability – with the strengths of a SQL/Schema-based system – reliability and structure. The result is a system that provides consistent document-style storage and retrieval within a structured SQL framework, catering to diverse form requirements while upholding data integrity and consistency.

```mermaid
erDiagram
  Form {
    UUID id PK "Primary Key"
    STRING analysisFolderNameS3
    STRING fileNameOrginal
    STRING fileNameS3
    JSONB formDeclared "Flexible container for varied form content, adhering to its Template schema"
    JSONB formDetected "Flexible container for what formDeclared likely is"
    BOOLEAN isDeleted "For soft-delete"
    INTEGER pageCount
    STRING previewFolderNameS3
    ENUM status
    UUID templateId FK "Foreign Key to Template"
    STRING textractJobId
    STRING uploadFolderNameS3
  }

  Template {
    UUID id PK "Primary Key"
    BOOLEAN isDeleted "For soft-delete"
    JSONB formSchema "Contains the custom schema that each Template utilizes, adhered to by each Form"
    INTEGER formSchemaCount "Count of fields in formSchema, automatically maintained"
    STRING name
  }

Template ||--o{ Form : "has many"
```

# Known Issues

- AWS `textract` does not appear to currently support FIFO-compatible notifications upon completion of a job. Therefore `SQS`, which subscribes to this `SNS` topic, is currently also non-FIFO. A solution may be to subscribe an adaptor `lambda` function to the non-FIFO `SNS` topic, which which then enqueues a FIFO-compatible message to the `SQS` queue, allowing `SQS` to be FIFO. See below example, noting that this approach may be overly complex.

```mermaid
graph LR
  API["..."] --> Textract
  Textract --"non-FIFO"--> SNS_NON_FIFO["SNS"]
  SNS_NON_FIFO --"non-FIFO"--> Lambda[["Lambda (adaptor)"]]
  Lambda --"FIFO"--> SQS
  SQS --"FIFO"--> FormToolbox["..."]
```
- The `Upload complete!` toast is not always auto-closing after its timeout completes.

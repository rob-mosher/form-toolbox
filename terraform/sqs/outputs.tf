output "sqs_queue_arn" {
  value = aws_sqs_queue.form_toolbox_queue.arn
}

output "sqs_queue_url" {
  value = aws_sqs_queue.form_toolbox_queue.url
}

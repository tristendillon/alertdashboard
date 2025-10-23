resource "aws_iam_role" "lambda_exec" {
  name = "sync-firstdue-alerts-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Add additional IAM policies here as needed for FirstDue API, database access, etc.
# Example:
# resource "aws_iam_role_policy" "lambda_custom_policy" {
#   name = "sync-firstdue-alerts-custom-policy"
#   role = aws_iam_role.lambda_exec.id
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "secretsmanager:GetSecretValue"
#         ]
#         Resource = "arn:aws:secretsmanager:us-east-1:*:secret:firstdue-*"
#       }
#     ]
#   })
# }

resource "aws_lambda_function" "dispatcher" {
  function_name = "sync-firstdue-alerts"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 90 # 12 iterations × 5s + buffer for API calls

  filename         = var.lambda_zip
  source_code_hash = filebase64sha256(var.lambda_zip)

  # Note: We rely on the 60-second execution time (12 × 5s) matching the 60-second schedule
  # to naturally prevent overlaps. Runtime lock detection provides additional safety.

  # Add environment variables here as needed for FirstDue API credentials, DB connection, etc.
  # environment {
  #   variables = {
  #     FIRSTDUE_API_KEY = var.firstdue_api_key
  #   }
  # }
}

resource "aws_cloudwatch_event_rule" "dispatcher_schedule" {
  name                = "sync-firstdue-alerts-dispatcher-schedule"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "dispatcher_target" {
  rule      = aws_cloudwatch_event_rule.dispatcher_schedule.name
  target_id = "sync-firstdue-alerts-dispatcher"
  arn       = aws_lambda_function.dispatcher.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_dispatcher" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.dispatcher.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.dispatcher_schedule.arn
}

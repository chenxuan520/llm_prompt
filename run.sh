#!/bin/bash
ssh aliyun2 "cd /root/web/llm_prompt;git pull;python3 ./generate_prompt_site.py"

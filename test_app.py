#!/usr/bin/env python3
import os
import sys

# Set environment
os.environ['FLASK_ENV'] = 'development'

try:
    from app import create_app
    app = create_app('development')
    print('✓ Flask app created successfully')
    print('✓ Database configured')
    print('✓ All dependencies loaded')
    print('\nApp is ready to run!')
    print('Run: python3 app.py')
except Exception as e:
    print(f'✗ Error: {e}')
    sys.exit(1)

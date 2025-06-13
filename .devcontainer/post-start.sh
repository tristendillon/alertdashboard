#!/bin/bash
# This script runs after the container is created and started.
# It removes the 'credsStore' key from the Docker config if it exists.

set -e # Exit immediately if a command exits with a non-zero status.

CONFIG_FILE="$HOME/.docker/config.json"
TEMP_CONFIG_FILE="${CONFIG_FILE}.tmp"

echo "--- Running post-start script (post-start.sh) ---"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Warning: 'jq' command not found. Cannot modify $CONFIG_FILE."
    echo "Please install jq (e.g., via devcontainer features or apt-get install jq)."
    # Decide if this is fatal. Exiting 0 allows container to continue.
    # Exit 1 would stop further post-start commands if any.
    exit 0
fi

# Check if the Docker config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Info: Docker config file not found at $CONFIG_FILE. Skipping credsStore removal."
    exit 0 # Exit gracefully, nothing to do.
fi

echo "Checking $CONFIG_FILE for 'credsStore'..."

# Check if credsStore actually exists using jq's exit code (-e)
# The > /dev/null suppresses jq's output (which would be the value if found)
if jq -e '.credsStore' "$CONFIG_FILE" > /dev/null; then
    echo "Found 'credsStore'. Attempting removal..."
    # Use jq to delete the key and write to a temporary file
    if jq 'del(.credsStore)' "$CONFIG_FILE" > "$TEMP_CONFIG_FILE"; then
        # If jq succeeded, replace the original file
        mv "$TEMP_CONFIG_FILE" "$CONFIG_FILE"
        echo "'credsStore' removed successfully from $CONFIG_FILE."
    else
        echo "Error: jq command failed to modify $CONFIG_FILE."
        # Clean up temp file on failure
        rm -f "$TEMP_CONFIG_FILE"
        exit 1 # Exit with an error code
    fi
else
    echo "'credsStore' not found in $CONFIG_FILE. No changes needed."
fi

echo "--- Post-start script finished ---"
exit 0
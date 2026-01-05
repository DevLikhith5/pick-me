#!/bin/bash

API="http://localhost:3000/api/v1"

CENTER_LAT=17.3850
CENTER_LNG=78.4867

DRIVERS=("d1" "d2" "d3")

# Seed RANDOM ONCE
RANDOM=$$

echo "Starting ride-hailing simulation (REAL randomness)"
echo "----------------------------------------"

while true
do
  echo "DRIVERS HEARTBEAT -------------------"

  for DRIVER in "${DRIVERS[@]}"
  do
    # Generate random float between -0.25 and +0.25
    LAT_OFFSET=$(awk -v r=$RANDOM 'BEGIN{print (r%500-250)/1000}')
    LNG_OFFSET=$(awk -v r=$RANDOM 'BEGIN{print ((r*3)%500-250)/1000}')

    LAT=$(awk -v c="$CENTER_LAT" -v o="$LAT_OFFSET" 'BEGIN{print c+o}')
    LNG=$(awk -v c="$CENTER_LNG" -v o="$LNG_OFFSET" 'BEGIN{print c+o}')

    curl -s -X POST "$API/driver/status/available" \
      -H "Content-Type: application/json" \
      -d "{
        \"driverId\": \"$DRIVER\",
        \"lat\": $LAT,
        \"lng\": $LNG
      }" > /dev/null

    echo "$DRIVER heartbeat @ ($LAT,$LNG)"
  done

  echo
  echo "USER REQUESTING RIDE ----------------"

  RESPONSE=$(curl -s -X POST "$API/match" \
    -H "Content-Type: application/json" \
    -d "{
      \"lat\": $CENTER_LAT,
      \"lng\": $CENTER_LNG
    }")

  echo "u1 -> $RESPONSE"

  echo
  echo "sleeping..."
  echo "----------------------------------------"
  sleep 5
done

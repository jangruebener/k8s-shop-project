#!/usr/bin/env bash

URL="http://aaecb565ca1cc4f7abb04ce41bf946f0-906594546.eu-central-1.elb.amazonaws.com/api/items"
DURATION="30s"
RATE="25"  # Requests pro Sekunde

hey -z $DURATION -q $RATE "$URL"

# Fire Department REST API

## Schema

All API access is over HTTPS, and accessed through https://sizeup.firstduesizeup.com/fd-api/v1/. All data is sent and received as JSON.

All timestamps are returned in ISO 8601 format:

    YYYY-MM-DDTHH:MM:SSZ

## Parameters

For POST request, parameters not included in the URL should be encoded as JSON with a Content-Type of 'application/json'.

## Root Endpoint

    https://sizeup.firstduesizeup.com/fd-api/v1/

## HTTP Verbs

Where possible, API v1 strives to use appropriate HTTP verbs for each action.

| Verb  | Description                                                                                                                             |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| HEAD  | Used for retrieving headers.                                                                                                            |
| GET   | Used for retrieving resources.                                                                                                          |
| POST  | Used for creating resources, or performing custom actions.                                                                              |
| PATCH | Used for updating resources with partial JSON data. A PATCH request may accept one or more of the attributes to update the resource.    |
| PUT   | Used for replacing resources or collections. For PUT requests with no body attribute, be sure to set the Content-Length header to zero. |

## Authentication

Requests that require authentication will return 403 Forbidden.

### OAuth2 Token (sent in a header)

    $ curl -H "Authorization: Bearer OAUTH-TOKEN" https://sizeup.firstduesizeup.com/fd-api/v1/foo/bar

This should only be used in server to server scenarios. Don't leak your OAuth application's client secret to your users.

### Timezones

We use UTC as the timezone to create the item.

## API Methods

### POST /fd-api/v1/auth/token

Get an Access Token.

    POST /fd-api/v1/auth/token

#### Parameters

| Name       | Type   | Description                                   |
| :--------- | :----- | :-------------------------------------------- |
| email      | string | **Required**. Email                           |
| password   | string | **Required**. Password                        |
| grant_type | string | **Required**. Grant Type (client_credentials) |

#### Example Request

    $ curl -i -k -H "Content-Type: application/json" -X POST -d '{"grant_type": "client_credentials", "email": "user1@fdsu.tld", "password": "password1"}' https://sizeup.firstduesizeup.com/fd-api/v1/auth/token

#### Success Response

    HTTP/1.1 200 OK
    {
      "access_token": "AAJEdz1tzkHFn6b76rj9SPAmE4BDCxRI",
      "expires_in": 1209600,
      "scope": "api web",
      "token_type": "bearer"
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Incorrect email\/password combination."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide grant_type parameter.",
      "errors": [
        {
          "field": "grant_type",
          "code": "missing_field",
          "message": "Please provide grant_type parameter."
        }
      ]
    }

### GET /fd-api/v1/dispatches

Get dispatches. Request will be paginated to 20 items by default.

    GET /fd-api/v1/dispatches

#### Parameters

| Name  | Type   | Description                                                                                         |
| :---- | :----- | :-------------------------------------------------------------------------------------------------- |
| page  | int    | Page number                                                                                         |
| since | string | Only dispatches created at or after this time are returned. This is a timestamp in ISO 8601 format. |

The [Link header](http://tools.ietf.org/html/rfc5988) includes pagination information:

    Link: <https://sizeup.firstduesizeup.com/fd-api/v1/dispatches?page=2>; rel="next",
      <https://sizeup.firstduesizeup.com/fd-api/v1/dispatches?page=7>; rel="last"

The possible `rel` values are:

| Name  | Description                                                   |
| :---- | :------------------------------------------------------------ |
| first | The link relation for the first page of results.              |
| prev  | The link relation for the immediate previous page of results. |
| next  | The link relation for the immediate next page of results.     |
| last  | The link relation for the last page of results.               |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "since=2019-02-15T19:00:00+00:00" https://sizeup.firstduesizeup.com/fd-api/v1/dispatches

#### Success Response

    HTTP/1.1 200 OK
    Link: <https://sizeup.firstduesizeup.com/fd-api/v1/dispatches?page=2>; rel="next",
      <https://sizeup.firstduesizeup.com/fd-api/v1/dispatches?page=7>; rel="last"

    [
      {
        "id": 123,
        "type": "FD TYPE",
        "message": "FD MESSAGE",
        "place_name": "PLACE NAME",
        "address": "FD ADDRESS",
        "address2": "APT 123",
        "cross_streets": "CROSS STREET1 / CROSS STREET2",
        "city": "FD CITY",
        "state_code": "WA",
        "latitude": 47.633523,
        "longitude": -122.277157,
        "unit_codes": ["U1"],
        "incident_type_code": "118CR",
        "status_code": "open",
        "xref_id": "FD_ID1",
        "created_at": "2019-02-16T19:42:00+00:00",
        "radio_channel": "RADIO CHANNEL",
        "alarm_level": "01"
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide a valid since parameter.",
      "errors": [
        {
          "field": "since",
          "code": "invalid",
          "message": "Please provide a date in ISO 8601 format."
        }
      ]
    }

### POST /fd-api/v1/dispatches

Create a dispatch.

    POST /fd-api/v1/dispatches

#### Parameters

| Name                  | Type   | Description                        |
| :-------------------- | :----- | :--------------------------------- |
| type                  | string | **Required**. Type                 |
| message               | string | Message                            |
| place_name            | string | Place Name                         |
| address               | string | **Required**. Address 1            |
| address2              | string | Address 2 (apt, unit, suite, etc)  |
| cross_streets         | string | Cross Streets                      |
| city                  | string | **Required**. City                 |
| state_code            | string | **Required**. State Code           |
| latitude              | string | Latitude                           |
| longitude             | string | Longitude                          |
| unit_codes            | string | Unit Codes (comma separated)       |
| incident_type_code    | string | Incident Type Code                 |
| xref_id               | string | Xref Id                            |
| nfirs_incident_number | string | Nfirs Incident Number              |
| radio_channel         | string | Radio Channel                      |
| alarm_level           | string | Alarm Level ( maximum length is 2) |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"type": "TYPE", "message": "MESSAGE", "address": "ADDRESS", "address2": "APT 123", "city": "CITY", "state_code": "NY", "latitude": 40.0, "longitude": -120.0, "unit_codes": "U1,U2,U3", "incident_type_code": "118CR", "xref_id": "FD_ID1"}' https://sizeup.firstduesizeup.com/fd-api/v1/dispatches

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PATCH /fd-api/v1/dispatches/xref/:xref_id

Update dispatch item.

    PATCH /fd-api/v1/dispatches/xref/:xref_id

#### Parameters

| Name                  | Type   | Description                        |
| :-------------------- | :----- | :--------------------------------- |
| type                  | string | Type                               |
| message               | string | Message                            |
| place_name            | string | Place Name                         |
| address               | string | Address 1                          |
| address2              | string | Address 2 (apt, unit, suite, etc)  |
| cross_streets         | string | Cross Streets                      |
| city                  | string | City                               |
| state_code            | string | State Code                         |
| latitude              | string | Latitude                           |
| longitude             | string | Longitude                          |
| unit_codes            | string | Unit Codes (comma separated)       |
| incident_type_code    | string | Incident Type Code                 |
| status_code           | string | Status Code. (Valid codes: closed) |
| nfirs_incident_number | string | Nfirs Incident Number              |
| radio_channel         | string | Radio Channel                      |
| alarm_level           | string | Alarm Level ( maximum length is 2) |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PATCH -d '{"status_code": "closed"}' https://sizeup.firstduesizeup.com/fd-api/v1/dispatches/xref/FD_ID1

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "State is of the wrong length (should be 2 characters)."
    }

### PUT /fd-api/v1/dispatches/xref/:xref_id

Update dispatch item completely.

    PUT /fd-api/v1/dispatches/xref/:xref_id

#### Parameters

| Name                  | Type   | Description                                            |
| :-------------------- | :----- | :----------------------------------------------------- |
| type                  | string | **Required**. Type                                     |
| message               | string | Message                                                |
| place_name            | string | Place Name                                             |
| address               | string | **Required**. Address 1                                |
| address2              | string | Address 2 (apt, unit, suite, etc)                      |
| cross_streets         | string | Cross Streets                                          |
| city                  | string | **Required**. City                                     |
| state_code            | string | **Required**. State Code                               |
| latitude              | string | Latitude                                               |
| longitude             | string | Longitude                                              |
| unit_codes            | string | Unit Codes (comma separated)                           |
| incident_type_code    | string | Incident Type Code                                     |
| status_code           | string | **Required**. Status Code. (Valid codes: open, closed) |
| nfirs_incident_number | string | Nfirs Incident Number                                  |
| radio_channel         | string | Radio Channel                                          |
| alarm_level           | string | Alarm Level ( maximum length is 2)                     |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"type": "TYPE", "message": "MESSAGE", "address": "ADDRESS", "address2": "APT 123", "city": "CITY", "state_code": "NY", "latitude": 40.0, "longitude": -120.0, "unit_codes": "U1,U2,U3", "incident_type_code": "118CR", "status_code": "closed"}' https://sizeup.firstduesizeup.com/fd-api/v1/dispatches/xref/FD_ID1

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### DELETE /fd-api/v1/dispatches/xref/:xref_id

Delete dispatch item.

    DELETE /fd-api/v1/dispatches/xref/:xref_id

#### Parameters

| Name    | Type   | Description           |
| :------ | :----- | :-------------------- |
| xref_id | string | **Required**. Xref Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/dispatches/xref/FD_ID1

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/get-units-by-dispatches

Get units by dispatches. Request will be paginated to 20 items of dispatch and its related units by default.

    GET /fd-api/v1/get-units-by-dispatches

#### Parameters

| Name        | Type    | Description                                                                                         |
| :---------- | :------ | :-------------------------------------------------------------------------------------------------- |
| page        | int     | Page number                                                                                         |
| since       | string  | Only dispatches created at or after this time are returned. This is a timestamp in ISO 8601 format. |
| dispatch_id | int     | Only to fetch the data of particular dispatch, use dispatch_id param.                               |
| active_only | boolean | To get all active dispatch incidents , use the active_only param pass the boolean value true.       |

The [Link header](http://tools.ietf.org/html/rfc5988) includes pagination information:

    Link Example 1: <https://sizeup.firstduesizeup.com/fd-api/v1/get-units-by-dispatches?page=2>; rel="next",
      <https://sizeup.firstduesizeup.com/fd-api/v1/get-units-by-dispatches?page=7>; rel="last"

    Link Example 2: <https://sizeup.firstduesizeup.com/fd-api/v1/get-units-by-dispatches?page=2&since=2019-02-15T19%3A00%3A00%2B00%3A00&active_only=true>; rel="next",
      <https://sizeup.firstduesizeup.com/fd-api/v1/get-units-by-dispatches?page=12&since=2019-02-15T19%3A00%3A00%2B00%3A00&active_only=true>; rel="last"

The possible `rel` values are:

| Name  | Description                                                   |
| :---- | :------------------------------------------------------------ |
| first | The link relation for the first page of results.              |
| prev  | The link relation for the immediate previous page of results. |
| next  | The link relation for the immediate next page of results.     |
| last  | The link relation for the last page of results.               |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "since=2024-09-01T19:00:00+00:00" https://sizeup.firstduesizeup.com/fd-api/v1/get-units-by-dispatches

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "dispatch_id=3418" https://sizeup.firstduesizeup.com/fd-api/v1/get-units-by-dispatches

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G ---data-urlencode "start=2024-09-01T08:00:00+00:00" --data-urlencode "active_only=true" https://sizeup.firstduesizeup.com/fd-api/v1/get-units-by-dispatches

#### Success Response

    HTTP/1.1 200 OK
    Link: <https://sizeup.firstduesizeup.com/fd-api/v1/get-units-by-dispatches?page=2>; rel="next",
      <https://sizeup.firstduesizeup.com/fd-api/v1/get-units-by-dispatches?page=7>; rel="last"

    [
      {
        "id": 3418,
        "type": "Mobile Property (Vehicle) Fire Test type",
        "status_code": "open",
        "incident_type_code": null,
        "unit_codes": [
          "ZODI1",
          "BRSH1",
          "SQD3",
          "TRK5",
          "UTIL3"
        ],
        "created_at": "2024-09-24T08:42:35+00:00",
        "place_name": "PLACE NAME",
        "address": "FD ADDRESS",
        "address2": "APT 123",
        "city": "FD CITY",
        "state_code": "WA",
        "location": "FD ADDRESS, FD CITY, WA, 12345",
        "latitude": 47.633523,
        "longitude": -122.277157,
        "message": null,
        "call_notes": "This is the call notes of dispatch mobile property  hyd w3",
        "units": [
          {
            "id": 2,
            "name": "User #2 Name",
            "email": "u2@fdsu.tld",
            "statuses": [
              {
                "name": "Transport",
                "status_code": "transport",
                "created_at": "2024-09-24T09:27:10+00:00"
              },
              {
                "name": "To Station",
                "status_code": "to_station",
                "created_at": "2024-09-24T09:26:35+00:00"
              },
              {
                "name": "On Scene",
                "status_code": "on_scene",
                "created_at": "2024-09-24T09:20:10+00:00"
              },
              {
                "name": "To Station",
                "status_code": "to_station",
                "created_at": "2024-09-24T09:19:50+00:00"
              }
            ]
          },
          {
            "id": 39605,
            "name": "User 39605 Name",
            "email": "user39605@fdsu.tld",
            "statuses": [
              {
                  "name": "On Station",
                  "status_code": "on_station",
                  "created_at": "2024-09-24T10:01:00+00:00"
              },
              {
                  "name": "In Service",
                  "status_code": "in_service",
                  "created_at": "2024-09-24T09:18:57+00:00"
              },
              {
                  "name": "On Scene",
                  "status_code": "on_scene",
                  "created_at": "2024-09-24T09:18:55+00:00"
              },
              {
                  "name": "On Station",
                  "status_code": "on_station",
                  "created_at": "2024-09-24T09:18:24+00:00"
              }
            ]
          }
        ]
      },
      {
          "id": 3415,
          "type": "Police/DPS Assistance",
          "status_code": "open",
          "incident_type_code": null,
          "unit_codes": [],
          "created_at": "2024-09-20T09:36:59+00:00",
          "place_name": null,
          "address": "Robert Street",
          "address2": null,
          "city": "Laredo",
          "state_code": null,
          "location": "ROBERT STREET, LAREDO, TX, 78046",
          "latitude": 33.1134323,
          "longitude": -96.111101,
          "message": null,
          "call_notes": "This is call notes for record",
          "units": []
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide a valid since parameter.",
      "errors": [
        {
          "field": "since",
          "code": "invalid",
          "message": "Please provide a date in ISO 8601 format."
        }
      ]
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide valid dispatch_id parameter.",
      "errors": [
          {
            "field": "dispatch_id",
            "code": "invalid",
            "message": "Please provide a valid integer."
          }
      ]
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide valid since, active_only parameters.",
      "errors": [
          {
            "field": "since",
            "code": "invalid",
            "message": "Please provide a date in ISO 8601 format."
          },
          {
            "field": "active_only",
            "code": "invalid",
            "message": "Please provide a valid boolean value true or false."
          }
      ]
    }

### HEAD /fd-api/v1/iams/email/:email

Check that IAMS authentication is enabled for the email.

    HEAD /fd-api/v1/iams/email/:email

#### Parameters

| Name  | Type   | Description         |
| :---- | :----- | :------------------ |
| email | string | **Required**. Email |

#### Example Request

    $ curl -i -k -I -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/iams/email/test@test.com

#### Success Response

    HTTP/1.1 200 OK

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/tce-premises/xref/:premise_id

Get a TCE premise.

    GET /fd-api/v1/tce-premises/xref/:premise_id

#### Parameters

| Name       | Type | Description              |
| :--------- | :--- | :----------------------- |
| premise_id | int  | **Required**. Premise Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/tce-premises/xref/111

#### Success Response

    HTTP/1.1 200 OK
    {
      "name": "The vault",
      "address1": "ADDRESS",
      "address2": "APT 25",
      "city": "CITY",
      "state_code": "WA",
      "zip": "12345",
      "latitude": 40,
      "longitude": -120,
      "status_code": "INACTIVE",
      "tag_color_code": null
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/tce-premises

Create a TCE premise.

    POST /fd-api/v1/tce-premises

#### Parameters

| Name           | Type   | Description                                           |
| :------------- | :----- | :---------------------------------------------------- |
| premise_id     | int    | **Required**. Premise Id                              |
| name           | string | Premise name                                          |
| address1       | string | **Required**. Address 1                               |
| address2       | string | Address 2 (apt, unit, suite, etc)                     |
| city           | string | **Required**. City                                    |
| state_code     | string | **Required**. State code                              |
| zip            | string | **Required**. Postal zip code                         |
| latitude       | string | Latitude                                              |
| longitude      | string | Longitude                                             |
| status_code    | string | **Required**. Status code (ACTIVE, INACTIVE, DELETED) |
| tag_color_code | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW)      |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"premise_id": 111, "name": "The vault", "address1": "ADDRESS", "address2": "APT 25", "city": "CITY", "state_code": "WA", "zip": "12345", "latitude": 40.0, "longitude": -120.0, "status_code": "ACTIVE"}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-premises

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PATCH /fd-api/v1/tce-premises/xref/:premise_id

Update a TCE premise.

    PATCH /fd-api/v1/tce-premises/xref/:premise_id

#### Parameters

| Name           | Type   | Description                                      |
| :------------- | :----- | :----------------------------------------------- |
| name           | string | Premise name                                     |
| address1       | string | Address 1                                        |
| address2       | string | Address 2 (apt, unit, suite, etc)                |
| city           | string | City                                             |
| state_code     | string | State Code                                       |
| zip            | string | Postal zip code                                  |
| latitude       | string | Latitude                                         |
| longitude      | string | Longitude                                        |
| status_code    | string | Status code (ACTIVE, INACTIVE, DELETED)          |
| tag_color_code | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW) |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PATCH -d '{"status_code": "INACTIVE"}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-premises/xref/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "State is of the wrong length (should be 2 characters)."
    }

### GET /fd-api/v1/tce-systems/xref/:system_id

Get a TCE system.

    GET /fd-api/v1/tce-systems/xref/:system_id

#### Parameters

| Name      | Type | Description             |
| :-------- | :--- | :---------------------- |
| system_id | int  | **Required**. System Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/tce-systems/xref/222

#### Success Response

    HTTP/1.1 200 OK
    {
      "premise_id": 111,
      "system_type_name": "Standpipe",
      "last_inspection_date": "2019-09-08",
      "next_inspection_date": "2020-09-10",
      "has_open_deficiencies": true,
      "status_code": "ACTIVE",
      "tag_color_code": "RED",
      "is_current": true,
      "is_inventory_tracked": false,
      "max_inventory_count": null,
      "is_service_dates_based_on_inventory": false
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/tce-systems

Create a TCE system.

    POST /fd-api/v1/tce-systems

#### Parameters

| Name                                | Type   | Description                                                                    |
| :---------------------------------- | :----- | :----------------------------------------------------------------------------- |
| system_id                           | int    | **Required**. Premise profile Id                                               |
| premise_id                          | int    | **Required**. Premise Id                                                       |
| system_type_name                    | string | **Required**. Master inspection report type name                               |
| last_inspection_date                | string | Last inspection date. ISO 8601 extended date format (Y YYY-MM-DD)              |
| next_inspection_date                | string | **Required**. Next inspection date. ISO 8601 extended date format (YYYY-MM-DD) |
| has_open_deficiencies               | bool   | **Required**. Has open deficiencies                                            |
| status_code                         | string | **Required**. Status code (ACTIVE, INACTIVE, DELETED)                          |
| tag_color_code                      | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW)                               |
| is_current                          | bool   | Is current system                                                              |
| is_inventory_tracked                | bool   | Is inventory tracked                                                           |
| max_inventory_count                 | int    | Max inventory count                                                            |
| is_service_dates_based_on_inventory | bool   | Is service dates based on inventory                                            |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"system_id": 222, "premise_id": 111, "system_type_name": "Standpipe", "last_inspection_date": "2019-09-08", "next_inspection_date": "2020-09-09", "has_open_deficiencies": true, "status_code": "ACTIVE", "is_inventory_tracked": false, "max_inventory_count": 0, "is_service_dates_based_on_inventory": false}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-systems

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide system_id parameter."
    }

### PATCH /fd-api/v1/tce-systems/xref/:system_id

Update a TCE system.

    PATCH /fd-api/v1/tce-systems/xref/:system_id

#### Parameters

| Name                                | Type   | Description                                                       |
| :---------------------------------- | :----- | :---------------------------------------------------------------- |
| premise_id                          | int    | Premise Id                                                        |
| system_type_name                    | string | Master inspection report type name                                |
| last_inspection_date                | string | Last inspection date. ISO 8601 extended date format (Y YYY-MM-DD) |
| next_inspection_date                | string | Next inspection date. ISO 8601 extended date format (YYYY-MM-DD)  |
| has_open_deficiencies               | bool   | Has open deficiencies                                             |
| status_code                         | string | Status code (ACTIVE, INACTIVE, DELETED)                           |
| tag_color_code                      | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW)                  |
| is_current                          | bool   | Is current system                                                 |
| is_inventory_tracked                | bool   | Is inventory tracked                                              |
| max_inventory_count                 | int    | Max inventory count                                               |
| is_service_dates_based_on_inventory | bool   | Is service dates based on inventory                               |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PATCH -d '{"next_inspection_date": "2020-09-10"}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-systems/xref/222

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please enter valid next inspection date."
    }

### GET /fd-api/v1/tce-inventories/xref/:inventory_id

Get a TCE inventory.

    GET /fd-api/v1/tce-inventories/xref/:inventory_id

#### Parameters

| Name         | Type | Description                |
| :----------- | :--- | :------------------------- |
| inventory_id | int  | **Required**. Inventory Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/tce-inventories/xref/333

#### Success Response

    HTTP/1.1 200 OK
    {
      "premise_id": 111,
      "system_id": 222,
      "system_type_name": "Elevator",
      "last_inspection_date": null,
      "next_inspection_date": "2020-09-07",
      "has_open_deficiencies": false,
      "description": "SW Tower Car 2",
      "status_code": "INACTIVE",
      "tag_color_code": "YELLOW",
      "is_current": false
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/tce-inventories

Create a TCE inventory.

    POST /fd-api/v1/tce-inventories

#### Parameters

| Name                  | Type   | Description                                                                    |
| :-------------------- | :----- | :----------------------------------------------------------------------------- |
| inventory_id          | int    | **Required**. Inventory Id                                                     |
| premise_id            | int    | **Required**. Premise Id                                                       |
| system_id             | int    | Premise profile Id                                                             |
| system_type_name      | string | **Required**. Master inspection report type name                               |
| last_inspection_date  | string | Last inspection date. ISO 8601 extended date format (YYYY-MM-DD)               |
| next_inspection_date  | string | **Required**. Next inspection date. ISO 8601 extended date format (YYYY-MM-DD) |
| has_open_deficiencies | bool   | **Required**. Has open deficiencies                                            |
| description           | string | Description                                                                    |
| status_code           | string | **Required**. Status code (ACTIVE, INACTIVE, DELETED)                          |
| tag_color_code        | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW)                               |
| is_current            | bool   | Is current inventory                                                           |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"inventory_id": 333, "premise_id": 111, "system_id": 222, "system_type_name": "Elevator", "next_inspection_date": "2020-09-07", "has_open_deficiencies": false, "description": "SW Tower Car 2", "status_code": "ACTIVE", "tag_color_code": "RED"}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-inventories

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide system_id parameter."
    }

### PATCH /fd-api/v1/tce-inventories/xref/:inventory_id

Update a TCE inventory.

    PATCH /fd-api/v1/tce-inventories/xref/:inventory_id

#### Parameters

| Name                  | Type   | Description                                                       |
| :-------------------- | :----- | :---------------------------------------------------------------- |
| premise_id            | int    | Premise Id                                                        |
| system_id             | int    | Premise profile Id                                                |
| system_type_name      | string | Master inspection report type name                                |
| last_inspection_date  | string | Last inspection date. ISO 8601 extended date format (Y YYY-MM-DD) |
| next_inspection_date  | string | Next inspection date. ISO 8601 extended date format (YYYY-MM-DD)  |
| has_open_deficiencies | bool   | Has open deficiencies                                             |
| description           | string | Description                                                       |
| status_code           | string | Status code (ACTIVE, INACTIVE, DELETED)                           |
| tag_color_code        | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW)                  |
| is_current            | bool   | Is current inventory                                              |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PATCH -d '{"has_open_deficiencies": false, "status_code": "INACTIVE", "tag_color_code": "YELLOW"}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-inventories/xref/333

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please enter valid status code."
    }

### GET /fd-api/v1/preplans/units/caution-notes

Get list of Caution Notes.

    GET /fd-api/v1/preplans/units/caution-notes

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| page | int  | Page number |

The [Link header](http://tools.ietf.org/html/rfc5988) includes pagination information:

    Link: <https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes?page=2>; rel="next",
      <https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes?page=7>; rel="last"

The possible `rel` values are:

| Name  | Description                                                   |
| :---- | :------------------------------------------------------------ |
| first | The link relation for the first page of results.              |
| prev  | The link relation for the immediate previous page of results. |
| next  | The link relation for the immediate next page of results.     |
| last  | The link relation for the last page of results.               |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "page=2" https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes

#### Success Response

    HTTP/1.1 200 OK
    Link: <https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes?page=3>; rel="next",
      <https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes?page=7>; rel="last"

    [
      {
        "xref_id": "123"
      },
      {
        "xref_id": "456"
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/preplans/units/caution-notes

Import a bunch of caution notes as preplan units. This will create or update every single record.
The response objects are returned in the order in which the caution notes were specified.

    POST /fd-api/v1/preplans/units/caution-notes

#### Parameters is an array of objects. Max size is 1000 items.

| Name          | Type   | Description                                    |
| :------------ | :----- | :--------------------------------------------- |
| xref_id       | number | **Required**. Xref Id                          |
| address       | string | **Required**. Address 1                        |
| apt           | string | Address 2                                      |
| city          | string | **Required**. City                             |
| state_code    | string | **Required**. State Code                       |
| notes         | string | **Required**. Caution Notes                    |
| category_code | string | Category Code. Can be INFO, CAUTION or DANGER. |
| priority_code | string | Priority Code. Can be HIGH, MEDIUM or LOW.     |
| from_date     | string | Valid From Date in ISO 8601 format             |
| to_date       | string | Valid To Date in ISO 8601 format               |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '[{"xref_id": 1, "address": "123 ADDRESS", "apt": "33A", "city": "CITY", "state_code": "NY", "notes": "CAUTION NOTES", "category_code": "INFO", "from_date": "2019-02-16", "to_date": "2029-02-16"}]' https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "success": true,
        "errors": []
      },
      {
        "success": false,
        "errors": ["Please provide address parameter."]
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Max items allowed exceeded.",
      "errors": []
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": Validation Failed. Empty parameters.",
      "errors": []
    }

### DELETE /fd-api/v1/preplans/units/caution-notes

Delete a bunch of Caution Notes by Xref ID

    DELETE /fd-api/v1/preplans/units/caution-notes

#### Parameters

| Name     | Type   | Description                                            |
| :------- | :----- | :----------------------------------------------------- |
| xref_ids | string | **Required**. Xref Ids. Max length allowed: 200 items. |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes?xref_ids=1,2,3

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "xref_id": "1",
        "success": true,
        "errors": []
      },
      {
        "xref_id": "222",
        "success": false,
        "errors": ["Please provide valid Xref Id."]
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Max items allowed exceeded.",
      "errors": []
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": Validation Failed. Empty parameters.",
      "errors": []
    }

### GET /fd-api/v1/nfirs-notifications/:id

Get a NFIRS notification.

    GET /fd-api/v1/nfirs-notifications/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/111

#### Success Response

    HTTP/1.1 200 OK
    {
      "id": 111,
      "dispatch_number": "DN-01",
      "incident_number": "2021-00001",
      "dispatch_type": "DISPATCH_TYPE",
      "dispatch_incident_type_code": "118CR",
      "alarm_at": "2019-02-16T19:42:00+00:004",
      "dispatch_notified_at": "2019-02-16T19:42:00+00:004",
      "alarms": 3,
      "place_name": "PLACE_NAME",
      "location_info": "LOCATION_INFO",
      "venue": "VENUE",
      "address": "ADDRESS",
      "unit": "APT 123",
      "cross_streets": "CROSS_STREETS",
      "city": "CITY",
      "state_code": "NY",
      "zip_code": "11111",
      "latitude": 40.0,
      "longitude": -120.0,
      "narratives": "NARRATIVES",
      "shift_name": "SHIFT_NAME",
      "notification_type": "NOTIFICATION_TYPE",
      "aid_type_code": 1,
      "aid_fdid_number": "12345",
      "aid_fdid_numbers": ["12345", "67890"],
      "controlled_at": "2019-02-16T19:42:00+00:004",
      "officer_in_charge": "oic-123456789",
      "call_completed_at": "2019-02-16T19:42:00+00:004",
      "zone": "Zone Name",
      "ems_incident_number": "2021",
      "ems_response_number": "00001",
      "station": "09",
      "emd_card_number": "10C01",
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/nfirs-notifications/number/:incident_number

Get a NFIRS notification.

    GET /fd-api/v1/nfirs-notifications/number/:incident_number

#### Parameters

| Name            | Type   | Description                   |
| :-------------- | :----- | :---------------------------- |
| incident_number | string | **Required**. Incident Number |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/111

#### Success Response

    HTTP/1.1 200 OK
    {
      "id": 111,
      "dispatch_number": "DN-01",
      "incident_number": "2021-00001",
      "dispatch_type": "DISPATCH_TYPE",
      "dispatch_incident_type_code": "118CR",
      "alarm_at": "2019-02-16T19:42:00+00:004",
      "dispatch_notified_at": "2019-02-16T19:42:00+00:004",
      "alarms": 3,
      "place_name": "PLACE_NAME",
      "location_info": "LOCATION_INFO",
      "venue": "VENUE",
      "address": "ADDRESS",
      "unit": "APT 123",
      "cross_streets": "CROSS_STREETS",
      "city": "CITY",
      "state_code": "NY",
      "zip_code": "11111",
      "latitude": 40.0,
      "longitude": -120.0,
      "narratives": "NARRATIVES",
      "shift_name": "SHIFT_NAME",
      "notification_type": "NOTIFICATION_TYPE",
      "aid_type_code": 1,
      "aid_fdid_number": "12345",
      "aid_fdid_numbers": ["12345", "67890"],
      "controlled_at": "2019-02-16T19:42:00+00:004",
      "officer_in_charge": "oic-123456789",
      "call_completed_at": "2019-02-16T19:42:00+00:004",
      "zone": "Zone Name",
      "ems_incident_number": "2021",
      "ems_response_number": "00001",
      "station": "09",
      "emd_card_number": "10C01",
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number

Get a NFIRS notification.

    GET /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number

#### Parameters

| Name            | Type   | Description                   |
| :-------------- | :----- | :---------------------------- |
| dispatch_number | string | **Required**. Dispatch Number |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/dispatch-number/111

#### Success Response

    HTTP/1.1 200 OK
    {
      "id": 111,
      "dispatch_number": "DN-01",
      "incident_number": "2021-00001",
      "dispatch_type": "DISPATCH_TYPE",
      "dispatch_incident_type_code": "118CR",
      "alarm_at": "2019-02-16T19:42:00+00:004",
      "dispatch_notified_at": "2019-02-16T19:42:00+00:004",
      "alarms": 3,
      "place_name": "PLACE_NAME",
      "location_info": "LOCATION_INFO",
      "venue": "VENUE",
      "address": "ADDRESS",
      "unit": "APT 123",
      "cross_streets": "CROSS_STREETS",
      "city": "CITY",
      "state_code": "NY",
      "zip_code": "11111",
      "latitude": 40.0,
      "longitude": -120.0,
      "narratives": "NARRATIVES",
      "shift_name": "SHIFT_NAME",
      "notification_type": "NOTIFICATION_TYPE",
      "aid_type_code": 1,
      "aid_fdid_number": "12345",
      "aid_fdid_numbers": ["12345", "67890"],
      "controlled_at": "2019-02-16T19:42:00+00:004",
      "officer_in_charge": "oic-123456789",
      "call_completed_at": "2019-02-16T19:42:00+00:004",
      "zone": "Zone Name",
      "ems_incident_number": "2021",
      "ems_response_number": "00001",
      "station": "09",
      "emd_card_number": "10C01",
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/nfirs-notifications

Create a NFIRS notification.

    POST /fd-api/v1/nfirs-notifications

#### Parameters

| Name                        | Type    | Description                                                               |
| :-------------------------- | :------ | :------------------------------------------------------------------------ |
| dispatch_number             | string  | Dispatch Number                                                           |
| incident_number             | string  | Incident Number                                                           |
| dispatch_type               | string  | **Required**. Dispatch Type                                               |
| dispatch_incident_type_code | string  | Dispatch Incident Type Code                                               |
| alarm_at                    | string  | Alarm At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| dispatch_notified_at        | string  | Dispatch Notified At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| alarms                      | int     | Alarms                                                                    |
| place_name                  | string  | Place Name                                                                |
| location_info               | string  | Location Info                                                             |
| venue                       | string  | Venue                                                                     |
| address                     | string  | **Required**. Address                                                     |
| unit                        | string  | Unit                                                                      |
| cross_streets               | string  | Cross Streets                                                             |
| city                        | string  | **Required**. City                                                        |
| state_code                  | string  | **Required**. State Code                                                  |
| zip_code                    | string  | Zip Code                                                                  |
| latitude                    | numeric | Latitude                                                                  |
| longitude                   | numeric | Longitude                                                                 |
| narratives                  | string  | Narratives                                                                |
| shift_name                  | string  | Shift Name                                                                |
| notification_type           | string  | Notification Type                                                         |
| aid_type_code               | int     | Aid Type Code                                                             |
| aid_fdid_number             | string  | Aid Fdid Number                                                           |
| aid_fdid_numbers            | array   | Aid Fdid Numbers                                                          |
| controlled_at               | string  | Controlled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)        |
| officer_in_charge           | string  | Officer in charge                                                         |
| call_completed_at           | string  | Call Complete At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)     |
| zone                        | string  | Zone                                                                      |
| house_num                   | string  | House number                                                              |
| prefix_direction            | string  | Prefix direction                                                          |
| street_name                 | string  | Street name                                                               |
| street_type                 | string  | Street type                                                               |
| suffix_direction            | string  | Suffix direction                                                          |
| ems_incident_number         | string  | EMS incident number                                                       |
| ems_response_number         | string  | EMS response number                                                       |
| station                     | string  | Station                                                                   |
| emd_card_number             | string  | EMD card number                                                           |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"dispatch_number": "DN-01", "incident_number": "2021-00001", "dispatch_type": "DISPATCH_TYPE", "dispatch_incident_type_code": "118CR", "alarm_at": "2019-02-16T19:42:00+00:004", "dispatch_notified_at": "2019-02-16T19:42:00+00:004", "alarms": 3, "place_name": "PLACE_NAME", "location_info": "LOCATION_INFO", "venue": "VENUE", "address": "ADDRESS", "unit": "APT 123", "cross_streets": "CROSS_STREETS", "city": "CITY", "state_code": "NY", "latitude": 40.0, "longitude": -120.0, "narratives": "NARRATIVES", "shift_name": "SHIFT_NAME", "notification_type": "NOTIFICATION_TYPE",  "aid_type_code": 1, "aid_fdid_number": "12345", "aid_fdid_numbers": ["12345", "67890"], "controlled_at": "2019-02-16T19:42:00+00:004", "zone": "Zone Name"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 111
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PUT /fd-api/v1/nfirs-notifications/:id

Update NFIRS notification item completely.

    PUT /fd-api/v1/nfirs-notifications/:id

#### Parameters

| Name                        | Type    | Description                                                               |
| :-------------------------- | :------ | :------------------------------------------------------------------------ |
| dispatch_number             | string  | Dispatch Number                                                           |
| incident_number             | string  | Incident Number                                                           |
| dispatch_type               | string  | **Required**. Dispatch Type                                               |
| dispatch_incident_type_code | string  | Dispatch Incident Type Code                                               |
| alarm_at                    | string  | Alarm At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| dispatch_notified_at        | string  | Dispatch Notified At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| alarms                      | int     | Alarms                                                                    |
| place_name                  | string  | Place Name                                                                |
| location_info               | string  | Location Info                                                             |
| venue                       | string  | Venue                                                                     |
| address                     | string  | **Required**. Address                                                     |
| unit                        | string  | Unit                                                                      |
| cross_streets               | string  | Cross Streets                                                             |
| city                        | string  | **Required**. City                                                        |
| state_code                  | string  | **Required**. State Code                                                  |
| zip_code                    | string  | Zip Code                                                                  |
| latitude                    | numeric | Latitude                                                                  |
| longitude                   | numeric | Longitude                                                                 |
| narratives                  | string  | Narratives                                                                |
| shift_name                  | string  | Shift Name                                                                |
| notification_type           | string  | Notification Type                                                         |
| aid_type_code               | int     | Aid Type Code                                                             |
| aid_fdid_number             | string  | Aid Fdid Number                                                           |
| aid_fdid_numbers            | array   | Aid Fdid Numbers                                                          |
| controlled_at               | string  | Controlled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)        |
| officer_in_charge           | string  | Officer in charge                                                         |
| call_completed_at           | string  | Call Complete At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)     |
| zone                        | string  | Zone                                                                      |
| house_num                   | string  | House number                                                              |
| prefix_direction            | string  | Prefix direction                                                          |
| street_name                 | string  | Street name                                                               |
| street_type                 | string  | Street type                                                               |
| suffix_direction            | string  | Suffix direction                                                          |
| ems_incident_number         | string  | EMS incident number                                                       |
| ems_response_number         | string  | EMS response number                                                       |
| station                     | string  | Station                                                                   |
| emd_card_number             | string  | EMD card number                                                           |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"dispatch_number": "DN-01", "incident_number": "2021-00001", "dispatch_type": "DISPATCH_TYPE", "dispatch_incident_type_code": "118CR", "alarm_at": "2019-02-16T19:42:00+00:004", "dispatch_notified_at": "2019-02-16T19:42:00+00:004", "alarms": 3, "place_name": "PLACE_NAME", "location_info": "LOCATION_INFO", "venue": "VENUE", "address": "ADDRESS", "unit": "APT 123", "cross_streets": "CROSS_STREETS", "city": "CITY", "state_code": "NY", "latitude": 40.0, "longitude": -120.0, "narratives": "NARRATIVES", "shift_name": "SHIFT_NAME", "notification_type": "NOTIFICATION_TYPE", "aid_type_code": 1, "aid_fdid_number": "12345", "aid_fdid_numbers": "["12345", "67890"]", "controlled_at": "2019-02-16T19:42:00+00:004", "zone": "Zone Name"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PUT /fd-api/v1/nfirs-notifications/number/:incident_number

Update NFIRS notification item completely.

    PUT /fd-api/v1/nfirs-notifications/number/:incident_number

#### Parameters

| Name                        | Type    | Description                                                               |
| :-------------------------- | :------ | :------------------------------------------------------------------------ |
| dispatch_number             | string  | Dispatch Number                                                           |
| dispatch_type               | string  | **Required**. Dispatch Type                                               |
| dispatch_incident_type_code | string  | Dispatch Incident Type Code                                               |
| alarm_at                    | string  | Alarm At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| dispatch_notified_at        | string  | Dispatch Notified At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| alarms                      | int     | Alarms                                                                    |
| place_name                  | string  | Place Name                                                                |
| location_info               | string  | Location Info                                                             |
| venue                       | string  | Venue                                                                     |
| address                     | string  | **Required**. Address                                                     |
| unit                        | string  | Unit                                                                      |
| cross_streets               | string  | Cross Streets                                                             |
| city                        | string  | **Required**. City                                                        |
| state_code                  | string  | **Required**. State Code                                                  |
| zip_code                    | string  | Zip Code                                                                  |
| latitude                    | numeric | Latitude                                                                  |
| longitude                   | numeric | Longitude                                                                 |
| narratives                  | string  | Narratives                                                                |
| shift_name                  | string  | Shift Name                                                                |
| notification_type           | string  | Notification Type                                                         |
| aid_type_code               | int     | Aid Type Code                                                             |
| aid_fdid_number             | string  | Aid Fdid Number                                                           |
| aid_fdid_numbers            | array   | Aid Fdid Numbers                                                          |
| controlled_at               | string  | Controlled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)        |
| officer_in_charge           | string  | Officer in charge                                                         |
| call_completed_at           | string  | Call Complete At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)     |
| zone                        | string  | Zone                                                                      |
| house_num                   | string  | House number                                                              |
| prefix_direction            | string  | Prefix direction                                                          |
| street_name                 | string  | Street name                                                               |
| street_type                 | string  | Street type                                                               |
| suffix_direction            | string  | Suffix direction                                                          |
| ems_incident_number         | string  | EMS incident number                                                       |
| ems_response_number         | string  | EMS response number                                                       |
| station                     | string  | Station                                                                   |
| emd_card_number             | string  | EMD card number                                                           |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"dispatch_number": "DN-01", "dispatch_type": "DISPATCH_TYPE", "dispatch_incident_type_code": "118CR", "alarm_at": "2019-02-16T19:42:00+00:004", "dispatch_notified_at": "2019-02-16T19:42:00+00:004", "alarms": 3, "place_name": "PLACE_NAME", "location_info": "LOCATION_INFO", "venue": "VENUE", "address": "ADDRESS", "unit": "APT 123", "cross_streets": "CROSS_STREETS", "city": "CITY", "state_code": "NY", "latitude": 40.0, "longitude": -120.0, "narratives": "NARRATIVES", "shift_name": "SHIFT_NAME", "notification_type": "NOTIFICATION_TYPE", "aid_type_code": 1, "aid_fdid_number": "12345", "aid_fdid_numbers": ["12345", "67890"], "controlled_at": "2019-02-16T19:42:00+00:004", "zone": "Zone"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PUT /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number

Update NFIRS notification item completely.

    PUT /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number

#### Parameters

| Name                        | Type    | Description                                                               |
| :-------------------------- | :------ | :------------------------------------------------------------------------ |
| incident_number             | string  | Incident Number                                                           |
| dispatch_type               | string  | **Required**. Dispatch Type                                               |
| dispatch_incident_type_code | string  | Dispatch Incident Type Code                                               |
| alarm_at                    | string  | Alarm At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| dispatch_notified_at        | string  | Dispatch Notified At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| alarms                      | int     | Alarms                                                                    |
| place_name                  | string  | Place Name                                                                |
| location_info               | string  | Location Info                                                             |
| venue                       | string  | Venue                                                                     |
| address                     | string  | **Required**. Address                                                     |
| unit                        | string  | Unit                                                                      |
| cross_streets               | string  | Cross Streets                                                             |
| city                        | string  | **Required**. City                                                        |
| state_code                  | string  | **Required**. State Code                                                  |
| zip_code                    | string  | Zip Code                                                                  |
| latitude                    | numeric | Latitude                                                                  |
| longitude                   | numeric | Longitude                                                                 |
| narratives                  | string  | Narratives                                                                |
| shift_name                  | string  | Shift Name                                                                |
| notification_type           | string  | Notification Type                                                         |
| aid_type_code               | int     | Aid Type Code                                                             |
| aid_fdid_number             | string  | Aid Fdid Number                                                           |
| aid_fdid_numbers            | array   | Aid Fdid Numbers                                                          |
| controlled_at               | string  | Controlled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)        |
| officer_in_charge           | string  | Officer in charge                                                         |
| call_completed_at           | string  | Call Complete At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)     |
| zone                        | string  | Zone                                                                      |
| house_num                   | string  | House number                                                              |
| prefix_direction            | string  | Prefix direction                                                          |
| street_name                 | string  | Street name                                                               |
| street_type                 | string  | Street type                                                               |
| suffix_direction            | string  | Suffix direction                                                          |
| ems_incident_number         | string  | EMS incident number                                                       |
| ems_response_number         | string  | EMS response number                                                       |
| station                     | string  | Station                                                                   |
| emd_card_number             | string  | EMD card number                                                           |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"incident_number": "DN-01", "dispatch_type": "DISPATCH_TYPE", "dispatch_incident_type_code": "118CR", "alarm_at": "2019-02-16T19:42:00+00:004", "dispatch_notified_at": "2019-02-16T19:42:00+00:004", "alarms": 3, "place_name": "PLACE_NAME", "location_info": "LOCATION_INFO", "venue": "VENUE", "address": "ADDRESS", "unit": "APT 123", "cross_streets": "CROSS_STREETS", "city": "CITY", "state_code": "NY", "latitude": 40.0, "longitude": -120.0, "narratives": "NARRATIVES", "shift_name": "SHIFT_NAME", "notification_type": "NOTIFICATION_TYPE", "aid_type_code": 1, "aid_fdid_number": "12345", "aid_fdid_numbers": ["12345", "67890"], "controlled_at": "2019-02-16T19:42:00+00:004", "zone": "Zone"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/dispatch-number/2021-00001

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### DELETE /fd-api/v1/nfirs-notifications/:id

Delete NFIRS notification item.

    DELETE /fd-api/v1/nfirs-notifications/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/nfirs-notifications/number/:incident_number

Delete NFIRS notification item.

    DELETE /fd-api/v1/nfirs-notifications/number/:incident_number

#### Parameters

| Name            | Type   | Description                   |
| :-------------- | :----- | :---------------------------- |
| incident_number | string | **Required**. Incident Number |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number

Delete NFIRS notification item.

    DELETE /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number

#### Parameters

| Name            | Type   | Description                   |
| :-------------- | :----- | :---------------------------- |
| dispatch_number | string | **Required**. Dispatch Number |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/dispatch-number/2021-00001

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses

Create a NFIRS notification apparatus.

    POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses

#### Parameters

| Name                                 | Type   | Description                                                                               |
| :----------------------------------- | :----- | :---------------------------------------------------------------------------------------- |
| unit_code                            | string | **Required**. Unit Code                                                                   |
| is_aid                               | bool   | Is Aid                                                                                    |
| dispatch_at                          | string | Dispatch At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| arrive_at                            | string | Arrive At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                            |
| dispatch_acknowledged_at             | string | Dispatch Acknowledged At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| enroute_at                           | string | Enroute At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                           |
| clear_at                             | string | Clear At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                             |
| back_in_service_at                   | string | Back In Service At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| canceled_at                          | string | Canceled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| patient_arrived_at                   | string | Patient Arrived At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| patient_transferred_at               | string | Patient Transferred At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)               |
| canceled_stage_code                  | string | Canceled Stage Code                                                                       |
| unit_left_scene_at                   | string | Unit Left Scene At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| arrival_destination_landing_area_at  | string | Arrival Destination Landing Area At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| patient_arrival_destination_at       | string | Patient Arrival Destination At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)       |
| destination_patient_transfer_care_at | string | Destination Patient Transfer Care At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| unit_back_home_location_at           | string | Unit Back Home Location At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)           |
| unit_arrived_staging_at              | string | Unit Arrived Staging At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| beginning_odo                        | string | Beginning Odometer Reading of Responding Vehicle                                          |
| on_scene_odo                         | string | On-Scene Odometer Reading of Responding Vehicle                                           |
| patient_dest_odo                     | string | Patient Destination Odometer Reading of Responding Vehicle                                |
| ending_odo                           | string | Ending Odometer Reading of Responding Vehicle                                             |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"unit_code": "R2", "is_aid": false, "dispatch_at": '2019-02-16T19:42:00+00:004', "arrive_at": "2019-02-16T19:42:00+00:004", "dispatch_acknowledged_at": "2019-02-16T19:42:00+00:004", "enroute_at": "2019-02-16T19:42:00+00:004", "clear_at": "2019-02-16T19:42:00+00:004", "back_in_service_at": "2019-02-16T19:42:00+00:004", "canceled_at": "2019-02-16T19:42:00+00:004", "patient_arrived_at": "2019-02-16T19:42:00+00:004", "patient_transferred_at": "2019-02-16T19:42:00+00:004", "canceled_stage_code": "on_scene"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 222
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide unit_code parameter.",
      "errors": [
        {
          "field": "unit_code",
          "code": "missing_field",
          "message": "Please provide unit_code parameter."
        }
      ]
    }

### POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses

Create a NFIRS notification apparatus.

    POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses

#### Parameters

| Name                                 | Type   | Description                                                                               |
| :----------------------------------- | :----- | :---------------------------------------------------------------------------------------- |
| unit_code                            | string | **Required**. Unit Code                                                                   |
| is_aid                               | bool   | Is Aid                                                                                    |
| dispatch_at                          | string | Dispatch At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| arrive_at                            | string | Arrive At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                            |
| dispatch_acknowledged_at             | string | Dispatch Acknowledged At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| enroute_at                           | string | Enroute At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                           |
| clear_at                             | string | Clear At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                             |
| back_in_service_at                   | string | Back In Service At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| canceled_at                          | string | Canceled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| patient_arrived_at                   | string | Patient Arrived At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| patient_transferred_at               | string | Patient Transferred At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)               |
| canceled_stage_code                  | string | Canceled Stage Code                                                                       |
| unit_left_scene_at                   | string | Unit Left Scene At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| arrival_destination_landing_area_at  | string | Arrival Destination Landing Area At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| patient_arrival_destination_at       | string | Patient Arrival Destination At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)       |
| destination_patient_transfer_care_at | string | Destination Patient Transfer Care At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| unit_back_home_location_at           | string | Unit Back Home Location At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)           |
| unit_arrived_staging_at              | string | Unit Arrived Staging At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| beginning_odo                        | string | Beginning Odometer Reading of Responding Vehicle                                          |
| on_scene_odo                         | string | On-Scene Odometer Reading of Responding Vehicle                                           |
| patient_dest_odo                     | string | Patient Destination Odometer Reading of Responding Vehicle                                |
| ending_odo                           | string | Ending Odometer Reading of Responding Vehicle                                             |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"unit_code": "R2", "is_aid": false, "dispatch_at": '2019-02-16T19:42:00+00:004', "arrive_at": "2019-02-16T19:42:00+00:004", "dispatch_acknowledged_at": "2019-02-16T19:42:00+00:004", "enroute_at": "2019-02-16T19:42:00+00:004", "clear_at": "2019-02-16T19:42:00+00:004", "back_in_service_at": "2019-02-16T19:42:00+00:004", "canceled_at": "2019-02-16T19:42:00+00:004", "patient_arrived_at": "2019-02-16T19:42:00+00:004", "patient_transferred_at": "2019-02-16T19:42:00+00:004", "canceled_stage_code": "on_scene"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide unit_code parameter.",
      "errors": [
        {
          "field": "unit_code",
          "code": "missing_field",
          "message": "Please provide unit_code parameter."
        }
      ]
    }

### POST /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number/apparatuses

Create a NFIRS notification apparatus.

    POST /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number/apparatuses

#### Parameters

| Name                                 | Type   | Description                                                                               |
| :----------------------------------- | :----- | :---------------------------------------------------------------------------------------- |
| unit_code                            | string | **Required**. Unit Code                                                                   |
| is_aid                               | bool   | Is Aid                                                                                    |
| dispatch_at                          | string | Dispatch At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| arrive_at                            | string | Arrive At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                            |
| dispatch_acknowledged_at             | string | Dispatch Acknowledged At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| enroute_at                           | string | Enroute At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                           |
| clear_at                             | string | Clear At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                             |
| back_in_service_at                   | string | Back In Service At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| canceled_at                          | string | Canceled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| patient_arrived_at                   | string | Patient Arrived At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| patient_transferred_at               | string | Patient Transferred At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)               |
| canceled_stage_code                  | string | Canceled Stage Code                                                                       |
| unit_left_scene_at                   | string | Unit Left Scene At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| arrival_destination_landing_area_at  | string | Arrival Destination Landing Area At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| patient_arrival_destination_at       | string | Patient Arrival Destination At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)       |
| destination_patient_transfer_care_at | string | Destination Patient Transfer Care At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| unit_back_home_location_at           | string | Unit Back Home Location At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)           |
| unit_arrived_staging_at              | string | Unit Arrived Staging At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| beginning_odo                        | string | Beginning Odometer Reading of Responding Vehicle                                          |
| on_scene_odo                         | string | On-Scene Odometer Reading of Responding Vehicle                                           |
| patient_dest_odo                     | string | Patient Destination Odometer Reading of Responding Vehicle                                |
| ending_odo                           | string | Ending Odometer Reading of Responding Vehicle                                             |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"unit_code": "R2", "is_aid": false, "dispatch_at": '2019-02-16T19:42:00+00:004', "arrive_at": "2019-02-16T19:42:00+00:004", "dispatch_acknowledged_at": "2019-02-16T19:42:00+00:004", "enroute_at": "2019-02-16T19:42:00+00:004", "clear_at": "2019-02-16T19:42:00+00:004", "back_in_service_at": "2019-02-16T19:42:00+00:004", "canceled_at": "2019-02-16T19:42:00+00:004", "patient_arrived_at": "2019-02-16T19:42:00+00:004", "patient_transferred_at": "2019-02-16T19:42:00+00:004", "canceled_stage_code": "on_scene"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/dispatch-number/2021-00001/apparatuses

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide unit_code parameter.",
      "errors": [
        {
          "field": "unit_code",
          "code": "missing_field",
          "message": "Please provide unit_code parameter."
        }
      ]
    }

### PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id

Update NFIRS notification apparatus item completely.

    PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id

#### Parameters

| Name                                 | Type   | Description                                                                               |
| :----------------------------------- | :----- | :---------------------------------------------------------------------------------------- |
| unit_code                            | string | **Required**. Unit Code                                                                   |
| is_aid                               | bool   | Is Aid                                                                                    |
| dispatch_at                          | string | Dispatch At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| arrive_at                            | string | Arrive At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                            |
| dispatch_acknowledged_at             | string | Dispatch Acknowledged At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| enroute_at                           | string | Enroute At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                           |
| clear_at                             | string | Clear At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                             |
| back_in_service_at                   | string | Back In Service At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| canceled_at                          | string | Canceled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| patient_arrived_at                   | string | Patient Arrived At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| patient_transferred_at               | string | Patient Transferred At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)               |
| canceled_stage_code                  | string | Canceled Stage Code                                                                       |
| unit_left_scene_at                   | string | Unit Left Scene At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| arrival_destination_landing_area_at  | string | Arrival Destination Landing Area At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| patient_arrival_destination_at       | string | Patient Arrival Destination At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)       |
| destination_patient_transfer_care_at | string | Destination Patient Transfer Care At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| unit_back_home_location_at           | string | Unit Back Home Location At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)           |
| unit_arrived_staging_at              | string | Unit Arrived Staging At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| beginning_odo                        | string | Beginning Odometer Reading of Responding Vehicle                                          |
| on_scene_odo                         | string | On-Scene Odometer Reading of Responding Vehicle                                           |
| patient_dest_odo                     | string | Patient Destination Odometer Reading of Responding Vehicle                                |
| ending_odo                           | string | Ending Odometer Reading of Responding Vehicle                                             |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"unit_code": "R2", "is_aid": false, "dispatch_at": '2019-02-16T19:42:00+00:004', "arrive_at": "2019-02-16T19:42:00+00:004", "dispatch_acknowledged_at": "2019-02-16T19:42:00+00:004", "enroute_at": "2019-02-16T19:42:00+00:004", "clear_at": "2019-02-16T19:42:00+00:004", "back_in_service_at": "2019-02-16T19:42:00+00:004", "canceled_at": "2019-02-16T19:42:00+00:004", "patient_arrived_at": "2019-02-16T19:42:00+00:004", "patient_transferred_at": "2019-02-16T19:42:00+00:004", "canceled_stage_code": "on_scene"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses/25

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide unit_code parameter.",
      "errors": [
        {
          "field": "unit_code",
          "code": "missing_field",
          "message": "Please provide unit_code parameter."
        }
      ]
    }

### PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code

Update NFIRS notification apparatus item completely.

    PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code

#### Parameters

| Name                                 | Type   | Description                                                                               |
| :----------------------------------- | :----- | :---------------------------------------------------------------------------------------- |
| is_aid                               | bool   | Is Aid                                                                                    |
| dispatch_at                          | string | Dispatch At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| arrive_at                            | string | Arrive At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                            |
| dispatch_acknowledged_at             | string | Dispatch Acknowledged At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| enroute_at                           | string | Enroute At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                           |
| clear_at                             | string | Clear At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                             |
| back_in_service_at                   | string | Back In Service At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| canceled_at                          | string | Canceled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| patient_arrived_at                   | string | Patient Arrived At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| patient_transferred_at               | string | Patient Transferred At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)               |
| canceled_stage_code                  | string | Canceled Stage Code                                                                       |
| unit_left_scene_at                   | string | Unit Left Scene At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| arrival_destination_landing_area_at  | string | Arrival Destination Landing Area At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| patient_arrival_destination_at       | string | Patient Arrival Destination At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)       |
| destination_patient_transfer_care_at | string | Destination Patient Transfer Care At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| unit_back_home_location_at           | string | Unit Back Home Location At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)           |
| unit_arrived_staging_at              | string | Unit Arrived Staging At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| beginning_odo                        | string | Beginning Odometer Reading of Responding Vehicle                                          |
| on_scene_odo                         | string | On-Scene Odometer Reading of Responding Vehicle                                           |
| patient_dest_odo                     | string | Patient Destination Odometer Reading of Responding Vehicle                                |
| ending_odo                           | string | Ending Odometer Reading of Responding Vehicle                                             |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"is_aid": false, "dispatch_at": '2019-02-16T19:42:00+00:004', "arrive_at": "2019-02-16T19:42:00+00:004", "dispatch_acknowledged_at": "2019-02-16T19:42:00+00:004", "enroute_at": "2019-02-16T19:42:00+00:004", "clear_at": "2019-02-16T19:42:00+00:004", "back_in_service_at": "2019-02-16T19:42:00+00:004", "canceled_at": "2019-02-16T19:42:00+00:004", "patient_arrived_at": "2019-02-16T19:42:00+00:004", "patient_transferred_at": "2019-02-16T19:42:00+00:004", "canceled_stage_code": "on_scene"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses/code/R2

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide unit_code parameter.",
      "errors": [
        {
          "field": "unit_code",
          "code": "missing_field",
          "message": "Please provide unit_code parameter."
        }
      ]
    }

### PUT /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number/apparatuses/code/:unit_code

Update NFIRS notification apparatus item completely.

    PUT /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number/apparatuses/code/:unit_code

#### Parameters

| Name                                 | Type   | Description                                                                               |
| :----------------------------------- | :----- | :---------------------------------------------------------------------------------------- |
| is_aid                               | bool   | Is Aid                                                                                    |
| dispatch_at                          | string | Dispatch At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| arrive_at                            | string | Arrive At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                            |
| dispatch_acknowledged_at             | string | Dispatch Acknowledged At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| enroute_at                           | string | Enroute At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                           |
| clear_at                             | string | Clear At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                             |
| back_in_service_at                   | string | Back In Service At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| canceled_at                          | string | Canceled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                          |
| patient_arrived_at                   | string | Patient Arrived At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| patient_transferred_at               | string | Patient Transferred At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)               |
| canceled_stage_code                  | string | Canceled Stage Code                                                                       |
| unit_left_scene_at                   | string | Unit Left Scene At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                   |
| arrival_destination_landing_area_at  | string | Arrival Destination Landing Area At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| patient_arrival_destination_at       | string | Patient Arrival Destination At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)       |
| destination_patient_transfer_care_at | string | Destination Patient Transfer Care At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| unit_back_home_location_at           | string | Unit Back Home Location At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)           |
| unit_arrived_staging_at              | string | Unit Arrived Staging At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| beginning_odo                        | string | Beginning Odometer Reading of Responding Vehicle                                          |
| on_scene_odo                         | string | On-Scene Odometer Reading of Responding Vehicle                                           |
| patient_dest_odo                     | string | Patient Destination Odometer Reading of Responding Vehicle                                |
| ending_odo                           | string | Ending Odometer Reading of Responding Vehicle                                             |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"is_aid": false, "dispatch_at": '2019-02-16T19:42:00+00:004', "arrive_at": "2019-02-16T19:42:00+00:004", "dispatch_acknowledged_at": "2019-02-16T19:42:00+00:004", "enroute_at": "2019-02-16T19:42:00+00:004", "clear_at": "2019-02-16T19:42:00+00:004", "back_in_service_at": "2019-02-16T19:42:00+00:004", "canceled_at": "2019-02-16T19:42:00+00:004", "patient_arrived_at": "2019-02-16T19:42:00+00:004", "patient_transferred_at": "2019-02-16T19:42:00+00:004", "canceled_stage_code": "on_scene"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/dispatch-number/2021-00001/apparatuses/code/R2

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide unit_code parameter.",
      "errors": [
        {
          "field": "unit_code",
          "code": "missing_field",
          "message": "Please provide unit_code parameter."
        }
      ]
    }

### DELETE /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id

Delete NFIRS notification apparatus item.

    DELETE /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses/25

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code

Delete NFIRS notification apparatus item.

    DELETE /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code

#### Parameters

| Name            | Type   | Description                   |
| :-------------- | :----- | :---------------------------- |
| incident_number | string | **Required**. Incident Number |
| unit_code       | string | **Required**. Unit Code       |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses/code/R2

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number/apparatuses/code/:unit_code

Delete NFIRS notification apparatus item.

    DELETE /fd-api/v1/nfirs-notifications/dispatch-number/:incident_number/apparatuses/code/:unit_code

#### Parameters

| Name            | Type   | Description                   |
| :-------------- | :----- | :---------------------------- |
| dispatch_number | string | **Required**. Dispatch Number |
| unit_code       | string | **Required**. Unit Code       |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses/code/R2

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel

Create a NFIRS notification personnel.

    POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel

#### Parameters

| Name                | Type   | Description         |
| :------------------ | :----- | :------------------ |
| xref_id             | string | Xref Id             |
| first_name          | string | First Name          |
| middle_initial      | string | Middle Initial      |
| last_name           | string | Last Name           |
| personnel_agency_id | string | Personnel Agency Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"xref_id": "NNP-01", "first_name": "FIRST_NAME", "middle_initial": "MIDDLE_INITIAL", "last_name": "LAST_NAME", "personnel_agency_id": "PA-01"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses/25/personnel

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 333
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

### POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel

Create a NFIRS notification personnel.

    POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel

#### Parameters

| Name                | Type   | Description         |
| :------------------ | :----- | :------------------ |
| xref_id             | string | Xref Id             |
| first_name          | string | First Name          |
| middle_initial      | string | Middle Initial      |
| last_name           | string | Last Name           |
| personnel_agency_id | string | Personnel Agency Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"xref_id": "NNP-01", "first_name": "FIRST_NAME", "middle_initial": "MIDDLE_INITIAL", "last_name": "LAST_NAME", "personnel_agency_id": "PA-01"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses/code/R2/personnel

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

### POST /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number/apparatuses/code/:unit_code/personnel

Create a NFIRS notification personnel.

    POST /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number/apparatuses/code/:unit_code/personnel

#### Parameters

| Name                | Type   | Description         |
| :------------------ | :----- | :------------------ |
| xref_id             | string | Xref Id             |
| first_name          | string | First Name          |
| middle_initial      | string | Middle Initial      |
| last_name           | string | Last Name           |
| personnel_agency_id | string | Personnel Agency Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"xref_id": "NNP-01", "first_name": "FIRST_NAME", "middle_initial": "MIDDLE_INITIAL", "last_name": "LAST_NAME", "personnel_agency_id": "PA-01"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/dispatch-number/2021-00001/apparatuses/code/R2/personnel

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

### PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id

Update NFIRS notification personnel item completely.

    PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id

#### Parameters

| Name                | Type   | Description         |
| :------------------ | :----- | :------------------ |
| xref_id             | string | Xref Id             |
| first_name          | string | First Name          |
| middle_initial      | string | Middle Initial      |
| last_name           | string | Last Name           |
| personnel_agency_id | string | Personnel Agency Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"xref_id": "NNP-01", "first_name": "FIRST_NAME", "middle_initial": "MIDDLE_INITIAL", "last_name": "LAST_NAME", "personnel_agency_id": "PA-01"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses/25/personnel/35

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

Update NFIRS notification personnel item completely.

    PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

#### Parameters

| Name                | Type   | Description         |
| :------------------ | :----- | :------------------ |
| first_name          | string | First Name          |
| middle_initial      | string | Middle Initial      |
| last_name           | string | Last Name           |
| personnel_agency_id | string | Personnel Agency Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"first_name": "FIRST_NAME", "middle_initial": "MIDDLE_INITIAL", "last_name": "LAST_NAME", "personnel_agency_id": "PA-01"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses/code/R2/personnel/xref/NNP-01

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### PUT /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

Update NFIRS notification personnel item completely.

    PUT /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

#### Parameters

| Name                | Type   | Description         |
| :------------------ | :----- | :------------------ |
| first_name          | string | First Name          |
| middle_initial      | string | Middle Initial      |
| last_name           | string | Last Name           |
| personnel_agency_id | string | Personnel Agency Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"first_name": "FIRST_NAME", "middle_initial": "MIDDLE_INITIAL", "last_name": "LAST_NAME", "personnel_agency_id": "PA-01"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/dispatch-number/2021-00001/apparatuses/code/R2/personnel/xref/NNP-01

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id

Delete NFIRS notification personnel item.

    DELETE /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses/25/personnel/35

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

Delete NFIRS notification personnel item.

    DELETE /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

#### Parameters

| Name            | Type   | Description                   |
| :-------------- | :----- | :---------------------------- |
| incident_number | string | **Required**. Incident Number |
| unit_code       | string | **Required**. Unit Code       |
| xref_id         | string | **Required**. Xref Id         |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses/code/R2/personnel/xref/NNP-01

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

Delete NFIRS notification personnel item.

    DELETE /fd-api/v1/nfirs-notifications/dispatch-number/:dispatch_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

#### Parameters

| Name            | Type   | Description                   |
| :-------------- | :----- | :---------------------------- |
| dispatch_number | string | **Required**. Dispatch Number |
| unit_code       | string | **Required**. Unit Code       |
| xref_id         | string | **Required**. Xref Id         |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/dispatch-number/2021-00001/apparatuses/code/R2/personnel/xref/NNP-01

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/apparatuses/unit-call-signs

Get apparatus unit call signs.

    GET /fd-api/v1/apparatuses/unit-call-signs

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/apparatuses/unit-call-signs

#### Success Response

    HTTP/1.1 200 OK
    ['CODE1', 'CODE2', 'CODE3']

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/apparatuses/vehicle-number/:vehicle_number

Get id, odometer, engine_hours, pto_hours and pump_hours of the apparatuses with vehicle number :vehicle_number.

    GET /fd-api/v1/apparatuses/vehicle-number/:vehicle_number

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/apparatuses/vehicle-number/23

#### Success Response

    HTTP/1.1 200 OK

    [
      {
        "id": 25,
        "odometer": 45,
        "engine_hours": 3,
        "pto_hours": 4,
        "pump_hours": 1
      },
      {
        ....
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "Apparatus not found."
    }

### GET /fd-api/v1/apparatuses/api-apparatus-id/:api_apparatus_id

Get id, odometer, engine_hours, pto_hours and pump_hours of the apparatuses with api apparatus id :api_apparatus_id.

    GET /fd-api/v1/apparatuses/api-apparatus-id/:api-apparatus-id

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/apparatuses/api-apparatus-id/723

#### Success Response

    HTTP/1.1 200 OK

    [
      {
        "id": 25,
        "odometer": 45,
        "engine_hours": 3,
        "pto_hours": 4,
        "pump_hours": 1
      },
      {
        ....
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "Apparatus not found."
    }

### GET /fd-api/v1/asset-work-order-boards

Get all asset work order boards.

    GET /fd-api/v1/asset-work-order-boards

#### Parameters

| Name      | Type   | Description |
| :-------- | :----- | :---------- |
| page_size | number | Page Size   |
| page      | number | Page        |
| name      | string | Name        |
| is_active | bool   | Is Active   |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X GET https://sizeup.firstduesizeup.com/fd-api/v1/asset-work-order-boards

#### Success Response

    HTTP/1.1 200 OK

    {
        "status": "success",
        "message": "Work orders Board retrieved successfully",
        "page": 2,
        "page_size": 20,
        "total": 52,
        "total_pages": 3,
        "links": {
            "first": "https://sizeup.firstduesizeup.test/fd-api/v1/asset-work-order-boards?page_size=20&is_active=true&page=1",
            "prev": "https://sizeup.firstduesizeup.test/fd-api/v1/asset-work-order-boards?page_size=20&is_active=true&page=1",
            "next": "https://sizeup.firstduesizeup.test/fd-api/v1/asset-work-order-boards?page_size=20&is_active=true&page=3",
            "last": "https://sizeup.firstduesizeup.test/fd-api/v1/asset-work-order-boards?page_size=20&is_active=true&page=3"
        },
        "params": {
            "name": "",
            "is_active": "true"
        },
        "results": [
            {
                "id": 100,
                "name": "Prueba 000112",
                "is_active": true,
                "status": "Active",
                "created_at": "09/16/2021",
                "updated_at": "08/31/2022"
            },
            ...
        ]
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
        "code": 0,
        "message": "Validation Failed. Please provide valid name, is_active parameters.",
        "errors": [
            {
                "field": "name",
                "code": "missing_field",
                "message": "Please provide a valid name."
            },
            {
                "field": "is_active",
                "code": "missing_field",
                "message": "Please provide a valid is_active."
            }
        ]
    }

### GET /fd-api/v1/asset-work-orders

Get all asset work order.

    GET /fd-api/v1/asset-work-orders

#### Parameters

| Name            | Type   | Description                                                   |
| :-------------- | :----- | :------------------------------------------------------------ |
| page_size       | number | Page Size                                                     |
| page            | number | Page                                                          |
| asset_type_code | string | Asset type code Example: (apparatus, equipment, kit, station) |
| search          | string | String for search in description and summary fields           |
| datetime_from   | string | This is a timestamp in ISO 8601                               |
| datetime_to     | string | This is a timestamp in ISO 8601                               |
| board_id        | number | Board Id                                                      |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 47dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/asset-work-orders

#### Success Response

    HTTP/1.1 200 OK

    {
        "status": "success",
        "message": "Work orders retrieved successfully",
        "page": 1,
        "page_size": 20,
        "total": 28,
        "total_pages": 2,
        "links": {
            "next": "https://sizeup.firstduesizeup.test/fd-api/v1/asset-work-orders?page=2",
            "last": "https://sizeup.firstduesizeup.test/fd-api/v1/asset-work-orders?page=2"
        },
        "params": [
            "search": null,
            "board_id": null,
            "asset_type_code": null,
            "datetime_from": null,
            "datetime_to": null,
        ],
        "results": [
            {
                "id": 219,
                "summary": "Preventative Maintenance",
                "status_name": "4",
                "number": 76,
                "eta": null,
                "priority_level_code": "low",
                "submitted_by": "User #2127",
                "created_at": "2025-04-23 15:45:09.262374",
                "created_by": "User #2127",
                "updated_at": null,
                "is_archived": false,
                "is_change_asset_allowed": false,
                "has_attachment": false,
                "incident_number": null,
                "description": "Preventative Maintenance",
                "work_performed": null,
                "apparatus_engine_hours": "999999.00",
                "apparatus_odometer": "132.00",
                "apparatus_pto_hours": "1.00",
                "apparatus_pump_hours": "5.00",
                "apparatus_starting_aerial_hours": "5.00",
                "apparatus": {
                    "id": 528,
                    "name": "APP01"
                },
                "fire_station": null,
                "kit": null,
                "equipment": null,
                "asset_work_order_board": {
                    "id": 109,
                    "name": "CWOB"
                },
                "vendor": null,
                "asset_work_order_type": {
                    "id": 137,
                    "name": "B3"
                },
                "teams": [
                    {
                      "id": 60,
                      "name": "Team 006"
                    },
                    {
                      "id": 57,
                      "name": "Team 005"
                    },
                    {
                      "id": 56,
                      "name": "Team 004"
                    },
                    {
                      "id": 54,
                      "name": "Team 003"
                    },
                    {
                      "id": 52,
                      "name": "Team 002"
                    },
                    {
                      "id": 51,
                      "name": "Team 001"
                    },
                    {
                      "id": 50,
                      "name": "Prueba"
                    }
                ],
                "users": []
            },
            ....
        ]
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
        "code": 0,
        "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
        "code": 0,
        "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
        "code": 0,
        "message": "Validation Failed. Please provide valid asset_type_code parameter.",
        "errors": [
            {
                "field": "asset_type_code",
                "code": "invalid",
                "message": "Invalid asset type code."
            }
       ]
    }

### GET /fd-api/v1/asset-work-orders/:id

Get an Asset work order.

    GET /fd-api/v1/asset-work-orders/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/asset-work-orders/130

#### Success Response

    HTTP/1.1 200 OK
    {
        "id": 130,
        "summary": "1111",
        "submitted_by": "AshevilleFire Admin",
        "number": 1,
        "created_by": "AshevilleFire Admin",
        "updated_by": "AshevilleFire Admin",
        "eta": null,
        "is_archived": false,
        "is_change_asset_allowed": true,
        "created_at": "2025-05-21 20:46:15.607457",
        "updated_at": "2025-05-22 16:07:22.98951",
        "archived_at": null,
        "incident_number": "",
        "description": "1111",
        "work_performed": "11111",
        "apparatus_engine_hours": "0.00",
        "apparatus_odometer": "0.00",
        "apparatus_pto_hours": "0.00",
        "apparatus_pump_hours": "0.00",
        "apparatus_starting_aerial_hours": null,
        "has_attachment": false,
        "priority_level_code": "low",
        "asset_work_order_status": {
            "id": 231,
            "name": "1"
        },
        "asset_work_order_type": {
            "id": 137,
            "name": "B3"
        },
        "asset_work_order_board": {
            "id": 109,
            "name": "CWOB"
        },
        "apparatus": {
            "id": 901,
            "name": "AAAAAAA"
        },
        "equipment": null,
        "fire_station": null,
        "kit": null,
        "asset_work_order_vendor": null,
        "asset_work_order_teams": [
            {
                "id": 50,
                "name": "Prueba"
            },
            {
                "id": 51,
                "name": "Team 001"
            },
            {
                "id": 52,
                "name": "Team 002"
            },
            {
                "id": 54,
                "name": "Team 003"
            },
            {
                "id": 56,
                "name": "Team 004"
            },
            {
                "id": 57,
                "name": "Team 005"
            },
            {
                "id": 60,
                "name": "Team 006"
            }
        ],
        "asset_work_order_users": null
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
        "code": 0,
        "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
        "code": 0,
        "message": "You are not authorized to perform this action."
    }

### PATCH /fd-api/v1/apparatuses/:id

Update odometer, engine_hours, pto_hours and/or pump_hours field of :id apparatus.
The requests should be at least one parameter. Parameter values should be numeric,
greater than 0 and its current value

    PATCH /fd-api/v1/apparatuses/:id

#### Parameters

| Name         | Type   | Description  |
| :----------- | :----- | :----------- |
| odometer     | number | Odometer     |
| engine_hours | number | Engine Hours |
| pto_hours    | number | PTP Hours    |
| pump_hours   | number | Pump Hours   |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PATCH -d '{"odometer": 20.50, "engine_hours": 5000.0}' https://sizeup.firstduesizeup.com/fd-api/v1/apparatuses/456

#### Success Response

    HTTP/1.1 200 OK

    []

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "Apparatus not found."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "Empty request data"
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "Invalid param: {text}, each should be numeric greater than 0.|Invalid params: {text}, each should be numeric greater than 0"
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "Invalid values.",
      "errors": [
        {
          "field": "odometer",
          "code": "invalid_field",
          "message": "Invalid odometer value, should be greater than current value."
        },
        {
          "field": "engine_hours",
          "code": "invalid_field",
          "message": "Invalid engine hours value, should be greater than current value."
        },
        {
          "field": "pto_hours",
          "code": "invalid_field",
          "message": "Invalid PTO hours value, should be greater than current value."
        },
        {
          "field": "pump_hours",
          "code": "invalid_field",
          "message": "Invalid pump hours value, should be greater than current value."
        }
      ]
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "Error updating apparatus."
    }

### GET /fd-api/v1/logs/settings

Get Settings for Logs.

    GET /fd-api/v1/logs/settings

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/logs/settings

#### Success Response

{
"is_fdapi_log_enabled": true
}

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/logs

Import a log entry.

    POST /fd-api/v1/logs

#### Parameters

| Name       | Type   | Description           |
| :--------- | :----- | :-------------------- |
| message    | string | **Required**. Message |
| level_code | string | **Required**. Level   |
| category   | string | Category              |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '[{"message": "Log1", "level_code": "error", "category": "application"}]' https://sizeup.firstduesizeup.com/fd-api/v1/logs

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Max items allowed exceeded.",
      "errors": []
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": Validation Failed. Empty parameters.",
      "errors": []
    }

### POST /fd-api/v1/logs/batch

Import a bunch of log entries. This will create every single entry.

    POST /fd-api/v1/logs

#### Parameters is an array of objects. Max size is 1000 items.

| Name       | Type   | Description           |
| :--------- | :----- | :-------------------- |
| message    | string | **Required**. Message |
| level_code | string | **Required**. Level   |
| category   | string | Category              |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '[{"message": "Log1", "level_code": "error", "category": "application"}]' https://sizeup.firstduesizeup.com/fd-api/v1/logs/batch

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Max items allowed exceeded.",
      "errors": []
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": Validation Failed. Empty parameters.",
      "errors": []
    }

### GET /fd-api/v1/schedule

Get the schedule from the Shift Board for a given date range.
**Note** most timestamps in this response are in the format YYYY-MM-DD HH:mm:ss, and are always
considered local time. This is to conserve "wall time" or "clock time" data even if timezones are
subject to change in the future.

    GET /fd-api/v1/schedule

#### Parameters

| Name  | Type   | Description                                                                                                                  |
| :---- | :----- | :--------------------------------------------------------------------------------------------------------------------------- |
| start | string | Show schedule from this date/time forward. ISO 8601 timestamp. Defaults to 00:00 today.                                      |
| end   | string | Show schedule until this date/time. ISO 8601 timestamp. Defaults to 00:00 tomorrow. Max. difference from `start` is 31 days. |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "start=2022-03-01T08:00:00+00:00" --data-urlencode "end=2022-03-02T08:00:00+00:00" https://sizeup.firstduesizeup.com/fd-api/v1/schedule

#### Success Response

    [
      {
        "date": "2022-03-21",
        "rotations": [
          {
            "id": 53,
            "name": "A Shift",
            "color": "#f44336"
          }
        ],
        "assignments": [
          {
            "id": 4,
            "start_at_local": "2022-03-21 08:00:00",
            "end_at_local": "2022-03-22 08:00:00",
            "name": "Station 1",
            "city": "Seattle",
            "pos": 1,
            "schedule_group_id": 1,
            "is_archived": false,
            "positions": [
              {
                "id": 1,
                "qualifier": {
                  "id": 1,
                  "name": "Captain",
                  "shortcode": "CPT",
                  "color": "#FF5722"
                },
                "work_shifts": [
                  {
                    "id": 146,
                    "start_date": "2022-02-24",
                    "end_date": "2038-01-01",
                    "notes": "",
                    "work_type": {
                      "id": 16,
                      "name": "Overtime",
                      "color": "#ff9800"
                    },
                    "work_subtype": null,
                    "user": {
                      "id": 3089,
                      "first_name": "John",
                      "last_name": "Doe",
                      "qualifiers": [],
                      "is_active": true
                    },
                    "kelly_days": null,
                    "type": "userRotation",
                    "segments": [],
                    "rotation": {
                      "id": 53,
                      "name": "A Shift",
                      "color": "#f44336"
                    }
                  }
                ],
                "vacancy_segments": [],
                "pos": 1,
                "is_vacant": true,
                "is_extra_vacancy": false
              },
              {
                "id": 2,
                "qualifier": {
                  "id": 2,
                  "name": "Firefighter",
                  "shortcode": "FF-1",
                  "color": "#3f51b5"
                },
                "work_shifts": [],
                "vacancy_segments": [],
                "pos": 2,
                "is_vacant": true,
                "is_extra_vacancy": false
              }
            ],
            "is_recurring": true,
            "range_start": "2020-09-22 08:00:00",
            "range_end": "2038-01-01 08:00:00",
            "duration_hours": 24
          },
          {
            "id": 35,
            "start_at_local": "2022-03-21 03:00:00",
            "end_at_local": "2022-03-21 08:00:00",
            "name": "Station 2",
            "city": "",
            "pos": 12,
            "schedule_group_id": null,
            "is_archived": false,
            "positions": [
              {
                "id": 90,
                "qualifier": null,
                "work_shifts": [],
                "vacancy_segments": [],
                "pos": 1,
                "is_vacant": true,
                "is_extra_vacancy": false
              },
              {
                "id": 91,
                "qualifier": null,
                "work_shifts": [],
                "vacancy_segments": [],
                "pos": 2,
                "is_vacant": true,
                "is_extra_vacancy": false
              }
            ],
            "is_recurring": true,
            "range_start": "2021-12-17 03:00:00",
            "range_end": "2038-01-01 08:00:00",
            "duration_hours": 5
          }
        ],
        "unassigned": [
          {
            "id": 147,
            "start_date": "2022-03-01",
            "end_date": "2038-01-01",
            "notes": null,
            "user": {
              "id": 3095,
              "first_name": "Jane",
              "last_name": "Doe",
              "qualifiers": [
                {
                  "id": 1,
                  "name": "Captain",
                  "shortcode": "CPT",
                  "color": "#FF5722"
                },
                {
                  "id": 15,
                  "name": "Emergency",
                  "shortcode": "EMT",
                  "color": "#cddc39"
                }
              ],
              "is_active": true
            },
            "assignment": null,
            "kelly_days": null,
            "type": "userRotation",
            "segments": [],
            "rotation": {
              "id": 53,
              "name": "A Shift",
              "color": "#f44336"
            }
          }
        ]
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide a valid start parameter.",
      "errors": [
        {
          "field": "start",
          "code": "invalid",
          "message": "Please provide a date in ISO 8601 format, e.g. 2022-03-21T15:46:03+00:00"
        }
      ]
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please choose a date range of max. 31 days."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "End cannot be before start, please check parameters."
    }

### GET /fd-api/v1/ems-cases/:id

Get a EMS case.

    GET /fd-api/v1/ems-cases/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111

#### Success Response

    HTTP/1.1 200 OK
    {
      "id": 1,
      "device_serial_number": "112223344444",
      "device_xref_id": "123498765",
      "device_model": "DEVICE_MODEL",
      "patient_xref_id": "09122022012365478",
      "case_xref_id": "09122022012365478",
      "case_started_at": "2022-02-16T19:42:00+00:00",
      "provider": "PROVIDER",
      "filename": "FILENAME",
      "patient_first_name": "PATIENT_FIRST_NAME",
      "patient_last_name": "PATIENT_LAST_NAME",
      "patient_middle_name": "PATIENT_MIDDLE_NAME",
      "patient_phone_number": "PATIENT_PHONE_NUMBER",
      "patient_email": "PATIENT_EMAIL",
      "patient_gender": "F",
      "patient_race": "PATIENT_RACE",
      "patient_age": 12,
      "patient_age_unit": "year",
      "patient_address": "PATIENT_ADDRESS",
      "patient_unit": "PATIENT_UNIT",
      "patient_cross_streets": "PATIENT_CROSS_STREETS",
      "patient_city": "PATIENT_CITY",
      "patient_state_code": "PATIENT_STATE_CODE",
      "patient_zip_code": "PATIENT_ZIP_CODE",
      "incident_location_type": "INCIDENT_LOCATION_TYPE",
      "incident_type": "INCIDENT_TYPE"
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/ems-cases/case-xref-id/:case_xref_id

Get a EMS case.

    GET /fd-api/v1/ems-cases/case-xref-id/:case_xref_id

#### Parameters

| Name         | Type   | Description                |
| :----------- | :----- | :------------------------- |
| case_xref_id | string | **Required**. Case Xref Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/case-xref-id/09122022012365478

#### Success Response

    HTTP/1.1 200 OK
    {
      "id": 1,
      "device_serial_number": "112223344444",
      "device_xref_id": "123498765",
      "device_model": "DEVICE_MODEL",
      "patient_xref_id": "09122022012365478",
      "case_xref_id": "09122022012365478",
      "case_started_at": "2022-02-16T19:42:00+00:00",
      "provider": "PROVIDER",
      "filename": "FILENAME",
      "patient_first_name": "PATIENT_FIRST_NAME",
      "patient_last_name": "PATIENT_LAST_NAME",
      "patient_middle_name": "PATIENT_MIDDLE_NAME",
      "patient_phone_number": "PATIENT_PHONE_NUMBER",
      "patient_email": "PATIENT_EMAIL",
      "patient_gender": "F",
      "patient_race": "PATIENT_RACE",
      "patient_age": 12,
      "patient_age_unit": "year",
      "patient_address": "PATIENT_ADDRESS",
      "patient_unit": "PATIENT_UNIT",
      "patient_cross_streets": "PATIENT_CROSS_STREETS",
      "patient_city": "PATIENT_CITY",
      "patient_state_code": "PATIENT_STATE_CODE",
      "patient_zip_code": "PATIENT_ZIP_CODE",
      "incident_location_type": "INCIDENT_LOCATION_TYPE",
      "incident_type": "INCIDENT_TYPE"
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/ems-cases

Create a ENS case.

    POST /fd-api/v1/ems-cases

#### Parameters

| Name                   | Type   | Description                                                                        |
| :--------------------- | :----- | :--------------------------------------------------------------------------------- |
| device_serial_number   | string | **Required**. Device Serial Number                                                 |
| device_xref_id         | string | Device Xref Id                                                                     |
| device_model           | string | Device Model                                                                       |
| patient_xref_id        | string | **Required**. Patient Xref Id                                                      |
| case_xref_id           | string | Case xref Id                                                                       |
| case_started_at        | string | **Required**. Case Started At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| provider               | string | **Required**. Provider                                                             |
| filename               | string | File Name                                                                          |
| patient_first_name     | string | Patient First Name                                                                 |
| patient_last_name      | string | Patient Last Name                                                                  |
| patient_middle_name    | string | Patient Middle Name                                                                |
| patient_phone_number   | string | Patient Phone Number                                                               |
| patient_email          | string | Patient Email                                                                      |
| patient_gender         | string | Patient Gender                                                                     |
| patient_race           | string | Patient Race                                                                       |
| patient_age            | int    | Patient Age                                                                        |
| patient_age_unit       | string | Patient Age Unit                                                                   |
| patient_address        | string | Patient Address                                                                    |
| patient_unit           | string | Patient Unit                                                                       |
| patient_cross_streets  | string | Patient Cross Streets                                                              |
| patient_city           | string | Patient City                                                                       |
| patient_state_code     | string | Patient State Code                                                                 |
| patient_zip_code       | string | Patient Zip Code                                                                   |
| incident_location_type | string | Incident Location Type                                                             |
| incident_type          | string | Incident Type                                                                      |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"device_serial_number": "112223344444", "device_xref_id": "123498765", "device_model": "DEVICE_MODEL", "patient_xref_id": "09122022012365478", "case_xref_id": "09122022012365478", "case_started_at": "2022-02-16T19:42:00+00:00", "provider": "PROVIDER", "filename": "FILENAME", "patient_first_name": "PATIENT_FIRST_NAME", "patient_last_name": "PATIENT_LAST_NAME", "patient_middle_name": "PATIENT_MIDDLE_NAME", "patient_phone_number": "PATIENT_PHONE_NUMBER","patient_email": "PATIENT_EMAIL", "patient_gender": "F", "patient_race": "PATIENT_RACE","patient_age": 12, "patient_age_unit": "year", "patient_address": "PATIENT_ADDRESS", "patient_unit": "PATIENT_UNIT", "patient_cross_streets": "PATIENT_CROSS_STREETS", "patient_city": "PATIENT_CITY", "patient_state_code": "PATIENT_STATE_CODE", "patient_zip_code": "PATIENT_ZIP_CODE", "incident_location_type": "INCIDENT_LOCATION_TYPE", "incident_type": "INCIDENT_TYPE"}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 111
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "patient_xref_id",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PUT /fd-api/v1/ems-cases/:id

Update EMS case item completely.

    PUT /fd-api/v1/ems-cases/:id

#### Parameters

| Name                   | Type   | Description                                                                        |
| :--------------------- | :----- | :--------------------------------------------------------------------------------- |
| device_serial_number   | string | **Required**. Device Serial Number                                                 |
| device_xref_id         | string | Device Xref Id                                                                     |
| device_model           | string | Device Model                                                                       |
| patient_xref_id        | string | **Required**. Patient Xref Id                                                      |
| case_xref_id           | string | Case xref Id                                                                       |
| case_started_at        | string | **Required**. Case Started At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| provider               | string | **Required**. Provider                                                             |
| filename               | string | File Name                                                                          |
| patient_first_name     | string | Patient First Name                                                                 |
| patient_last_name      | string | Patient Last Name                                                                  |
| patient_middle_name    | string | Patient Middle Name                                                                |
| patient_phone_number   | string | Patient Phone Number                                                               |
| patient_email          | string | Patient Email                                                                      |
| patient_gender         | string | Patient Gender                                                                     |
| patient_race           | string | Patient Race                                                                       |
| patient_age            | int    | Patient Age                                                                        |
| patient_age_unit       | string | Patient Age Unit                                                                   |
| patient_address        | string | Patient Address                                                                    |
| patient_unit           | string | Patient Unit                                                                       |
| patient_cross_streets  | string | Patient Cross Streets                                                              |
| patient_city           | string | Patient City                                                                       |
| patient_state_code     | string | Patient State Code                                                                 |
| patient_zip_code       | string | Patient Zip Code                                                                   |
| incident_location_type | string | Incident Location Type                                                             |
| incident_type          | string | Incident Type                                                                      |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"device_serial_number": "112223344444", "device_xref_id": "123498765", "device_model": "DEVICE_MODEL", "patient_xref_id": "09122022012365478", "case_xref_id": "09122022012365478", "case_started_at": "2022-02-16T19:42:00+00:00", "provider": "PROVIDER", "filename": "FILENAME", "patient_first_name": "PATIENT_FIRST_NAME", "patient_last_name": "PATIENT_LAST_NAME", "patient_middle_name": "PATIENT_MIDDLE_NAME", "patient_phone_number": "PATIENT_PHONE_NUMBER","patient_email": "PATIENT_EMAIL", "patient_gender": "F", "patient_race": "PATIENT_RACE","patient_age": 12, "patient_age_unit": "year", "patient_address": "PATIENT_ADDRESS", "patient_unit": "PATIENT_UNIT", "patient_cross_streets": "PATIENT_CROSS_STREETS", "patient_city": "PATIENT_CITY", "patient_state_code": "PATIENT_STATE_CODE", "patient_zip_code": "PATIENT_ZIP_CODE", "incident_location_type": "INCIDENT_LOCATION_TYPE", "incident_type": "INCIDENT_TYPE"}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "patient_xref_id",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### DELETE /fd-api/v1/ems-cases/:id

Delete EMS case item.

    DELETE /fd-api/v1/ems-cases/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs

Get EMS case vital signs

    GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "since=2019-02-15T19:00:00+00:00" https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-vital-signs

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "id": 123,
        "adjusted_at": "2022-02-16T19:42:00+00:00",
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs

Create a ENS case vital sign.

    POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs

#### Parameters

| Name                          | Type    | Description                                                                    |
| :---------------------------- | :------ | :----------------------------------------------------------------------------- |
| adjusted_at                   | string  | **Required**. Adjusted At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| pta                           | bool    | PTA                                                                            |
| level_of_responsiveness       | string  | Level of Responsiveness                                                        |
| heart_rate                    | string  | Heart Rate                                                                     |
| pulse_rhythm                  | string  | Pulse Rhythm                                                                   |
| heart_rate_method             | string  | Heart Rate Method                                                              |
| systolic_blood_pressure       | string  | Systolic Blood Pressure                                                        |
| diastolic_blood_pressure      | string  | Diastolic Blood_Pressure                                                       |
| blood_pressure_method         | string  | Blood Pressure Method                                                          |
| respiratory_rate              | string  | Respiratory Rate                                                               |
| respiratory_effort            | string  | Respiratory Effort                                                             |
| pulse_oximetry                | string  | Pulse Oximetry                                                                 |
| carbon_monoxide               | string  | Carbon Monoxide                                                                |
| pain                          | string  | Pain                                                                           |
| pain_scale_type               | string  | Pain Scale Type                                                                |
| temperature_f                 | numeric | Temperature                                                                    |
| temperature_method            | string  | Temperature Method                                                             |
| blood_glucose                 | string  | Blood Glucose                                                                  |
| interpretation_method         | string  | Interpretation Method                                                          |
| glasgow_coma_score_eye        | string  | Glasgow Coma Score Eye                                                         |
| glasgow_coma_score_verbal     | string  | Glasgow Coma Score Verbal                                                      |
| glasgow_coma_score_motor      | string  | Glasgow Coma Score Motor                                                       |
| glasgow_coma_score_qualifier  | string  | Glasgow Coma Score Qualifier                                                   |
| glasgow_coma_score_total      | string  | Glasgow Coma Score Total                                                       |
| revised_trauma_score          | string  | Revised Trauma Score                                                           |
| stroke_scale_score            | string  | Stroke Scale Score                                                             |
| stroke_scale_type             | string  | Stroke Scale Type                                                              |
| reperfusion_checklist_result  | string  | Reperfusion Checklist Result                                                   |
| trend_origin                  | string  | Trend Origin                                                                   |
| carbon_dioxide_unit           | string  | Carbon Dioxide Unit                                                            |
| end_tidal_carbon_dioxide      | string  | End Tidal Carbon Dioxide                                                       |
| end_tidal_carbon_dioxide_type | string  | End Tidal Carbon Dioxide Type                                                  |
| mean_arterial_pressure        | string  | Mean Arterial Pressure                                                         |
| apgar_score                   | int     | Apgar Score                                                                    |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"adjusted_at": "2022-02-16T19:42:00+00:004", "pta": 1, "level_of_responsiveness": "LEVEL_OF_RSPONSIVENESS", "heart_rate": "HEART_RATE", "pulse_rhythm": "PULSE_RHYTHM", "heart_rate_method": "HEART_RATE_METHOD", "systolic_blood_pressure": "SYSTOLIC_BLOOD_PRESSURE", "diastolic_blood_pressure": "DIASTOLIC_BLOOD_PRESSURE", "blood_pressure_method": "_BLOOD_PRESSURE_METHOD", "respiratory_rate": "RESPIRATORY_RATE", "respiratory_effort": "RESPIRATORY_EFFORT", "pulse_oximetry": "PULSE_OXIMETRY", "carbon_monoxide": "CARON_MONOXIDE", "pain": "PAIN", "pain_scale_type": "PAIN_SCALE_SCORE", "temperature_f": 10, "temperature_method": "TEMPERATURE_METHOD", "blood_glucose": "BLOOD_GLUCOSE", "interpretation_method": "INTERPRETATION_METHOD", "glasgow_coma_score_eye": "GLASGOW_COMA_SCORE_EYE", "glasgow_coma_score_verbal": "GLASGOW_COMA_SCORE_VERBAL", "glasgow_coma_score_motor": "GLASGOW_COMA_SCOREMOTOR", "glasgow_coma_score_qualifier": "GLASGOW_COMA_SCORE_QUALIFIER", "glasgow_coma_score_total": "GLASGOW_COMA_SCORE_TOTAL", "revised_trauma_score": "REVISED_TRAUMA_SCORE", "stroke_scale_score": "STROKE_SCALE_SCORE", "stroke_scale_type": "STROKE_SCALE_TYPE", "reperfusion_checklist_result": "REPERFUSION_CHECKLIST_RESULT", "end_tidal_carbon_dioxide": "END_TIDAL_CARBON_DIOXIDE", "carbon_dioxide_unit": "CARBON_DIOXIDE_UNIT", "trend_origin": "TREND_ORIGIN", "end_tidal_carbon_dioxide_type": "END_TIDAL_CARBON_DIOXIDE_TYPE", "mean_arterial_pressure": "MEAN_ARTERIAL_PRESSURE", "apgar_score": 1}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-vital-signs

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 111
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "adjusted_at",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs/:id

Update EMS case vital sign item completely.

    PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs/:id

#### Parameters

| Name                          | Type    | Description                                                                    |
| :---------------------------- | :------ | :----------------------------------------------------------------------------- |
| adjusted_at                   | string  | **Required**. Adjusted At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| pta                           | bool    | PTA                                                                            |
| level_of_responsiveness       | string  | Level of Responsiveness                                                        |
| heart_rate                    | string  | Heart Rate                                                                     |
| pulse_rhythm                  | string  | Pulse Rhythm                                                                   |
| heart_rate_method             | string  | Heart Rate Method                                                              |
| systolic_blood_pressure       | string  | Systolic Blood Pressure                                                        |
| diastolic_blood_pressure      | string  | Diastolic Blood_Pressure                                                       |
| blood_pressure_method         | string  | Blood Pressure Method                                                          |
| respiratory_rate              | string  | Respiratory Rate                                                               |
| respiratory_effort            | string  | Respiratory Effort                                                             |
| pulse_oximetry                | string  | Pulse Oximetry                                                                 |
| carbon_monoxide               | string  | Carbon Monoxide                                                                |
| pain                          | string  | Pain                                                                           |
| pain_scale_type               | string  | Pain Scale Type                                                                |
| temperature_f                 | numeric | Temperature                                                                    |
| temperature_method            | string  | Temperature Method                                                             |
| blood_glucose                 | string  | Blood Glucose                                                                  |
| interpretation_method         | string  | Interpretation Method                                                          |
| glasgow_coma_score_eye        | string  | Glasgow Coma Score Eye                                                         |
| glasgow_coma_score_verbal     | string  | Glasgow Coma Score Verbal                                                      |
| glasgow_coma_score_motor      | string  | Glasgow Coma Score Motor                                                       |
| glasgow_coma_score_qualifier  | string  | Glasgow Coma Score Qualifier                                                   |
| glasgow_coma_score_total      | string  | Glasgow Coma Score Total                                                       |
| revised_trauma_score          | string  | Revised Trauma Score                                                           |
| stroke_scale_score            | string  | Stroke Scale Score                                                             |
| stroke_scale_type             | string  | Stroke Scale Type                                                              |
| reperfusion_checklist_result  | string  | Reperfusion Checklist Result                                                   |
| trend_origin                  | string  | Trend Origin                                                                   |
| carbon_dioxide_unit           | string  | Carbon Dioxide Unit                                                            |
| end_tidal_carbon_dioxide      | string  | End Tidal Carbon Dioxide                                                       |
| end_tidal_carbon_dioxide_type | string  | End Tidal Carbon Dioxide Type                                                  |
| mean_arterial_pressure        | string  | Mean Arterial Pressure                                                         |
| apgar_score                   | int     | Apgar Score                                                                    |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"adjusted_at": "2022-02-16T19:42:00+00:004", "pta": 1, "level_of_responsiveness": "LEVEL_OF_RSPONSIVENESS", "heart_rate": "HEART_RATE", "pulse_rhythm": "PULSE_RHYTHM", "heart_rate_method": "HEART_RATE_METHOD", "systolic_blood_pressure": "SYSTOLIC_BLOOD_PRESSURE", "diastolic_blood_pressure": "DIASTOLIC_BLOOD_PRESSURE", "blood_pressure_method": "_BLOOD_PRESSURE_METHOD", "respiratory_rate": "RESPIRATORY_RATE", "respiratory_effort": "RESPIRATORY_EFFORT", "pulse_oximetry": "PULSE_OXIMETRY", "carbon_monoxide": "CARON_MONOXIDE", "pain": "PAIN", "pain_scale_type": "PAIN_SCALE_SCORE", "temperature_f": 10, "temperature_method": "TEMPERATURE_METHOD", "blood_glucose": "BLOOD_GLUCOSE", "interpretation_method": "INTERPRETATION_METHOD", "glasgow_coma_score_eye": "GLASGOW_COMA_SCORE_EYE", "glasgow_coma_score_verbal": "GLASGOW_COMA_SCORE_VERBAL", "glasgow_coma_score_motor": "GLASGOW_COMA_SCOREMOTOR", "glasgow_coma_score_qualifier": "GLASGOW_COMA_SCORE_QUALIFIER", "glasgow_coma_score_total": "GLASGOW_COMA_SCORE_TOTAL", "revised_trauma_score": "REVISED_TRAUMA_SCORE", "stroke_scale_score": "STROKE_SCALE_SCORE", "stroke_scale_type": "STROKE_SCALE_TYPE", "reperfusion_checklist_result": "REPERFUSION_CHECKLIST_RESULT", "end_tidal_carbon_dioxide": "END_TIDAL_CARBON_DIOXIDE", "carbon_dioxide_unit": "CARBON_DIOXIDE_UNIT", "trend_origin": "TREND_ORIGIN", "end_tidal_carbon_dioxide_type": "END_TIDAL_CARBON_DIOXIDE_TYPE", "mean_arterial_pressure": "MEAN_ARTERIAL_PRESSURE", "apgar_score": 1}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-vital-signs/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "adjusted_at",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs:id

Delete EMS case vital sign item.

    DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-vital-signs/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots

Get EMS case snapshots.

    GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "since=2019-02-15T19:00:00+00:00" https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-snapshots

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "id": 123,
        "recorded_at": "2022-02-16T19:42:00+00:00",
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots

Create a EMS case snapshot.

    POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots

#### Parameters

| Name           | Type   | Description                                                      |
| :------------- | :----- | :--------------------------------------------------------------- |
| xref_id        | string | Xref Id                                                          |
| cardiac_rhythm | string | Cardiac rhythm                                                   |
| ecg_type       | string | Ecg Type                                                         |
| length         | string | Length                                                           |
| recorded_at    | string | Recorded At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| started_at     | string | Started At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| treatment      | string | Treatment                                                        |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"xref_id": "XREF_ID", "cardiac_rhythm": "CARDIAC_RHYTHM", "ecg_type": "RCG_TYPE", "length": "10:10:00", "recorded_at": "2022-02-16T19:42:00+00:004", "started_at": "2022-02-16T19:42:00+00:004", "treatment": "TREATMENT"}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/11/ems-case-snapshots

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 111
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

### PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:id

Update EMS case snapshot item completely.

    PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:id

#### Parameters

| Name           | Type   | Description                                                      |
| :------------- | :----- | :--------------------------------------------------------------- |
| xref_id        | string | Xref Id                                                          |
| cardiac_rhythm | string | Cardiac rhythm                                                   |
| ecg_type       | string | Ecg Type                                                         |
| length         | string | Length                                                           |
| recorded_at    | string | Recorded At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| started_at     | string | Started At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| treatment      | string | Treatment                                                        |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"xref_id": "XREF_ID", "cardiac_rhythm": "CARDIAC_RHYTHM", "ecg_type": "RCG_TYPE", "length": "10:10:00", "recorded_at": "2022-02-16T19:42:00+00:004", "started_at": "2022-02-16T19:42:00+00:004", "treatment": "TREATMENT"}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-snapshots/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:id

Delete EMS case snapshot item.

    DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-snapshots/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:ems_case_snapshot_id/ems-case-snapshot-images

Create a EMS case snapshot image.

    POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:ems_case_snapshot_id/ems-case-snapshot-images

#### Parameters

| Name          | Type   | Description                        |
| :------------ | :----- | :--------------------------------- |
| pos           | int    | Position                           |
| waveform_type | string | Waveform Type                      |
| image_base64  | string | **Required**. Base64 encoded image |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"pos": 1, "waveform_type": "WAVEFORM_TYPE", "image_base64": "data:image/png;..."}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/11/ems-case-snapshots/111/ems-case-snapshot-images

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 111
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "image_base64",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:ems_case_snapshot_id/ems-case-snapshot-images/:id

Update EMS case snapshot image item completely.

    PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:ems_case_snapshot_id/ems-case-snapshot-images/:id

#### Parameters

| Name          | Type   | Description                        |
| :------------ | :----- | :--------------------------------- |
| pos           | int    | Position                           |
| waveform_type | string | Waveform Type                      |
| image_base64  | string | **Required**. Base64 encoded image |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"pos": 1, "waveform_type": "WAVEFORM_TYPE", "image_base64": "data:image/png;..."}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-snapshots/111/ems-case-snapshot-images/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "image_base64",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:ems_case_snapshot_id/ems-case-snapshot-images/:id

Delete EMS case snapshot item.

    DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:ems_case_snapshot_id/ems-case-snapshot-images/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-snapshots/111/ems-case-snapshot-images/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads

Get EMS case twelve leads.

    GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "since=2019-02-15T19:00:00+00:00" https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-twelve-leads

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "id": 123,
        "adjusted_at": "2022-02-16T19:42:00+00:00",
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads

Create a EMS case twelve lead.

    POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads

#### Parameters

| Name         | Type   | Description                        |
| :----------- | :----- | :--------------------------------- |
| image_base64 | string | **Required**. Base64 encoded image |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"image_base64": "data:image/png;..."}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-twelve-leads

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 111
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "image_base64",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads/:id

Update EMS case twelve lead item completely.

    PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads/:id

#### Parameters

| Name         | Type   | Description                        |
| :----------- | :----- | :--------------------------------- |
| image_base64 | string | **Required**. Base64 encoded image |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"image_base64": "data:image/png;..."}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-twelve-leads/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "image_base64",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads/:id

Delete EMS case twelve lead item.

    DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-twelve-leads/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads

Get EMS case three leads.

    GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "since=2025-01-10T19:00:00+00:00" https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-three-leads

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "id": 123,
        "started_at": "2025-01-10T19:42:00+00:00",
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads

Create a EMS case three lead.

    POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads

#### Parameters

| Name         | Type   | Description                        |
| :----------- | :----- | :--------------------------------- |
| image_base64 | string | **Required**. Base64 encoded image |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"image_base64": "data:image/png;..."}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-three-leads

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 111
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "image_base64",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads/:id

Update EMS case three lead item completely.

    PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads/:id

#### Parameters

| Name         | Type   | Description                        |
| :----------- | :----- | :--------------------------------- |
| image_base64 | string | **Required**. Base64 encoded image |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"image_base64": "data:image/png;..."}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-three-leads/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "image_base64",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads/:id

Delete EMS case three lead item.

    DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-three-leads/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker

Get EMS case treatment marker.

    GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-treatment-marker

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "id": 123,
        "recorded_at": "2024-05-15T19:00:00+00:00",
        "code": "Code Treatment Marker",
        "name": "Name Treatment Marker",
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker

Create a EMS case treatment marker.

    POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker

#### Parameters

| Name        | Type   | Description                                                                    |
| :---------- | :----- | :----------------------------------------------------------------------------- |
| recorded_at | string | **Required**. Recorded At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| code        | string | Monitor Code Treatment Marker                                                  |
| name        | string | Monitor Name Treatment Marker                                                  |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"recorded_at": "2024-05-15T13:15:59Z", "code": "CODE", "name": "NAME"}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-treatment-marker

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 111
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

### PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker/:id

Update EMS case treatment marker item completely.

    PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker/:id

#### Parameters

| Name        | Type   | Description                                                                    |
| :---------- | :----- | :----------------------------------------------------------------------------- |
| recorded_at | string | **Required**. Recorded At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| code        | string | Monitor Code Treatment Marker                                                  |
| name        | string | Monitor Name Treatment Marker                                                  |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"recorded_at": "2024-05-15T13:15:59Z", "code": "CODE", "name": "NAME"}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-treatment-marker/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker/:id

Delete EMS case treatment marker item.

    DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-treatment-marker/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker

Get EMS case medication marker.

    GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-medication-marker

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "id": 123,
        "recorded_at": "2024-05-15T19:00:00+00:00",
        "code": "Code Medication Marker",
        "name": "Name Medication Marker",
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker

Create a EMS case medication marker.

    POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker

#### Parameters

| Name        | Type   | Description                                                                    |
| :---------- | :----- | :----------------------------------------------------------------------------- |
| recorded_at | string | **Required**. Recorded At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| code        | string | Monitor Code Medication Marker                                                 |
| name        | string | Monitor Name Medication Marker                                                 |
| dosage      | float  | Dosage                                                                         |
| dosage_unit | string | Dosage Unit                                                                    |
| route       | string | Route                                                                          |
| volume      | int    | Volume                                                                         |
| volume_unit | string | Volume Unit                                                                    |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"recorded_at": "2024-05-15T13:15:59Z", "code": "CODE", "name": "NAME", "dosage": "DOSAGE", "dosage_unit": "DOSAGE_UNIT", "route": "ROUTE", "volume": "VOLUME", "volume_unit": "VOLUME_UNIT"}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-medication-marker

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 111
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

### PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker/:id

Update EMS case medication marker item completely.

    PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker/:id

#### Parameters

| Name        | Type   | Description                                                                    |
| :---------- | :----- | :----------------------------------------------------------------------------- |
| recorded_at | string | **Required**. Recorded At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| code        | string | Monitor Code Medication Marker                                                 |
| name        | string | Monitor Name Medication Marker                                                 |
| dosage      | float  | Dosage                                                                         |
| dosage_unit | string | Dosage Unit                                                                    |
| route       | string | Route                                                                          |
| volume      | int    | Volume                                                                         |
| volume_unit | string | Volume Unit                                                                    |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"recorded_at": "2024-05-15T13:15:59Z", "code": "CODE", "name": "NAME", "dosage": "DOSAGE", "dosage_unit": "DOSAGE_UNIT", "route": "ROUTE", "volume": "VOLUME", "volume_unit": "VOLUME_UNIT"}' https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-medication-marker/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker/:id

Delete EMS case medication marker item.

    DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/ems-cases/111/ems-case-medication-marker/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/aladtec-personnel

Get aladtec personnel.

    GET /fd-api/v1/aladtec-personnel

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/aladtec-personnel

#### Success Response

    HTTP/1.1 200 OK

    [
      {
        "id": 123,
        "agency_id": "AG87654323",
        "name": "NAME"
        "staffing_calendar_date": "2015-12-29T13:15:59+00:00",
        "staffing_start_date: "2015-12-29T15:15:59+00:00",
        "staffing_end_date": "2015-12-29T15:15:59+00:00",
        "is_working": true,
        "unit_call_sign": "UNIT3",
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/aladtec-personnel

Create a aladtec personnel.

    POST /fd-api/v1/aladtec-personnel

#### Parameters

| Name                   | Type   | Description                          |
| :--------------------- | :----- | :----------------------------------- | ------------------- |
| agency_id              | string | **Required**. agency id              |
| name                   | string | name                                 |
| staffing_calendar_date | string | **Required**. staffing calendar date |
| staffing_start_date    | string | **Required**. staffing start date    |
| staffing_end_date      | string | **Required**. staffing end date      |
| is_working             | bool   | **Required**. true                   | false if is working |
| unit_call_sign         | string | **Required**. unit call sign         |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"agency_id": "AG87654323", "name": "TEST NAME", "staffing_calendar_date": "2015-12-29T13:15:59Z", "staffing_start_date": "2015-12-29T15:15:59Z", "staffing_end_date": "2015-12-29T17:15:59Z", "is_working" : false, "unit_call_sign" : "UNIT3"}' https://sizeup.firstduesizeup.com/fd-api/v1/aladtec-personnel

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide agency_id parameter.",
      "errors": [
        {
          "field": "agency_id",
          "code": "missing_field",
          "message": "Please provide agency_id parameter."
        }
      ]
    }

### PUT /fd-api/v1/aladtec-personnel/:id

Update aladtec personnel item completely.

    PUT /fd-api/v1/aladtec-personnel/:id

#### Parameters

| Name                   | Type   | Description                          |
| :--------------------- | :----- | :----------------------------------- | ------------------- |
| agency_id              | string | **Required**. agency id              |
| name                   | string | name                                 |
| staffing_calendar_date | string | **Required**. staffing calendar date |
| staffing_start_date    | string | **Required**. staffing start date    |
| staffing_end_date      | string | **Required**. staffing end date      |
| is_working             | bool   | **Required**. true                   | false if is working |
| unit_call_sign         | string | **Required**. unit call sign         |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"agency_id": "AG87654323", "name": "TEST NAME", "staffing_calendar_date": "2015-12-29T13:15:59Z", "staffing_start_date": "2015-12-29T15:15:59Z", "staffing_end_date": "2015-12-29T17:15:59Z", "is_working" : false, "unit_call_sign" : "UNIT3"}' https://sizeup.firstduesizeup.com/fd-api/v1/aladtec-personnel/3

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide agency_id parameter.",
      "errors": [
        {
          "field": "agency_id",
          "code": "missing_field",
          "message": "Please provide agency_id parameter."
        }
      ]
    }

### DELETE /fd-api/v1/aladtec-personnel/:id

Delete aladtec personnel item.

    DELETE /fd-api/v1/aladtec-personnel/:id

#### Parameters

| Name | Type   | Description      |
| :--- | :----- | :--------------- |
| id   | string | **Required**. id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/aladtec-personnel/3

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/dispatch-units/codes

Get dispatch unit codes.

    GET /fd-api/v1/dispatch-units/codes

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/dispatch-units/codes

#### Success Response

    HTTP/1.1 200 OK
    ['CODE1', 'CODE2', 'CODE3']

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/fire-incidents/

Get Fire Incident information. Request will be paginated to 500 items by default.

    GET /fd-api/v1/fire-incidents

#### Parameters

| Name             | Type   | Description                                                                                                      |
| :--------------- | :----- | :--------------------------------------------------------------------------------------------------------------- |
| status_codes     | string | Filter by incident report status codes. `incomplete` or `pending_authorization` or `authorized` delimited by `,` |
| incident_number  | string | Filter by incident report number                                                                                 |
| start_alarm_at   | string | Filter by start alarm date at. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                               |
| end_alarm_at     | string | Filter by end alarm date at. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                                 |
| start_updated_at | string | Filter by start update date at. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                              |
| end_updated_at   | string | Filter end update date at. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                                   |
| page             | int    | Page number                                                                                                      |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/fire-incidents?status_codes=incomplete,authorized&start_alarm_at=2023-6-10T13:15:59Z&end_alarm_at=2023-6-10T17:15:59Z

#### Success Response

    HTTP/1.1 200 OK

    [
      fire_incidents: [
        {
          "incident_number": "1234565",
          "status_code": "incompleted",
          "actual_incident_type": "100",
          "aid_type": "1",
          "alarm_at": "2022-11-14T19:42:00+00:00",
          "created_at": "2022-11-14T19:42:00+00:00",
          "updated_at": "2022-11-14T19:42:00+00:00",
          "dispatch_type_code": "TYP001",
          "dispatch_comment": "comment",
          "dispatch_notified_at": "2022-11-14T19:42:00+00:00",
          "alarms": 3,
          "water_on_fire_at": "2022-11-14T19:42:00+00:00",
          "rit_established_at": "2022-11-14T19:42:00+00:00",
          "rehab_established_discontinued_at": "2022-11-14T19:42:00+00:00",
          "control_utility_at": "2022-11-14T19:42:00+00:00",
          "command_established_at": "2022-11-14T19:42:00+00:00",
          "primary_search_complete_at": "2022-11-14T19:42:00+00:00",
          "loss_stopped_at": "2022-11-14T19:42:00+00:00",
          "action_takens": ["15", "21", "44"]
          "property_loss": 1,
          "contents_loss": 1,
          "pre_incident_property_value": 1,
          "pre_incident_contents_value": 1,
          "department_narratives": [
            {
              "edited_by": "User",
              "edited_at": "2022-11-14T19:42:00+00:00",
              "narrative": "Narrative"
            }
          ],
          "latitude": 47.633523,
          "longitude": -122.277157,
          "address": "ADDRESS",
          "suite": "",
          "city": null,
          "state": null,
          "zip_code": "12345",
          "first_due": "A3",
          "battalion": "Gig Harbor (WA) FD",
          "response_zone": Zone 1,
          "apparatuses": [
            {
              "unit_id": "AP1000",
              "primary_use_code": "1",
              "is_primary": false,
              "dispatch_at": "2022-11-14T19:42:00+00:00",
              "enroute_at": "2022-11-14T19:42:00+00:00",
              "arrived_at": "2022-11-14T19:42:00+00:00",
              "cleared_at": "2022-11-14T19:42:00+00:00",
              "personnels": [
                {
                  "first_name": "Jane",
                  "last_name": "Dog",
                  "agency_id": "AG111",
                  "rank": "Firefighter"
                }
              ]
            }
          ]
        },
        {
          ...
        }
      ],
    total: 500
    pages: 1
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide a valid status_codes parameter.",
      "errors": [
        {
          "field": "status_codes",
          "code": "invalid",
          "message": "The status_codes: S1, S2 are not valid."
        }
      ]
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide a valid start_alarm_at parameter.",
      "errors": [
        {
          "field": "start_alarm_at",
          "code": "invalid",
          "message": "Please provide a date in ISO 8601 format."
        }
      ]
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide a valid end_alarm_at parameter.",
      "errors": [
        {
          "field": "end_alarm_at",
          "code": "invalid",
          "message": "Please provide a date in ISO 8601 format."
        }
      ]
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide a valid start_update_at parameter.",
      "errors": [
        {
          "field": "start_updated_at",
          "code": "invalid",
          "message": "Please provide a date in ISO 8601 format."
        }
      ]
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide a valid end_updated_at parameter.",
      "errors": [
        {
          "field": "end_updated_at",
          "code": "invalid",
          "message": "Please provide a date in ISO 8601 format."
        }
      ]
    }

### GET /fd-api/v1/device-locations

Get device locations.

    GET /fd-api/v1/device-locations

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/device-locations

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "id": 1,
        "name": "Public Name (Device #1)",
        "type": "Fire Department Engine",
        "latitude": "40.0000000",
        "longitude": "-120.0000000",
        "status_code": "active",
        "updated_at": "2017-12-15T10:42:00+00:00",
        "responder_status": "On Station",
        "responder_status_code": "on_station",
        "responding_address": "55155",
        "responding_dispatch_place_location": "55155 ROBERT STREET , 55155",
        "fire_station_id": 113,
        "fire_station_name_or_number": "Firehouse No. 4 (Sacramento, California)"
      },
      ...
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/invoice/:occupancy_id

Get occupancy invoices pending to be paid.

    GET /fd-api/v1/invoice/:occupancy_id

#### Example Request

    $ curl -i -k https://sizeup.firstduesizeup.com/fd-api/v1/invoice/12456

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "status": "UnPaid",
        "amount": "105.00",
        "dueDate": "2024/03/01",
        "externalReferenceNumber": "912f1663-3e4d-4204-bef7-fd8ee253f13e",
        "invoice_number": "ARL-INV-2024-0000068",
        "occupancy_id": "12456",
      },
      ...
    ]

#### Error Response

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide required parameters."
    }

### POST /fd-api/v1/paymentus/confirm-payment

Confirm Paymentus payment or refund.

    POST /fd-api/v1/paymentus/confirm-payment

#### Parameters

| Name                    | Type   | Description                              |
| :---------------------- | :----- | :--------------------------------------- |
| referenceNumber         | string | **Required**. paymentus reference number |
| externalreferenceNumber | string | **Required**. invoice reference number   |
| amount                  | float  | **Required**. payment/refund amount      |
| paymentDate             | string | payment/refund date                      |
| status                  | string | **Required**. payment/refund status      |

#### Example Request

    $ curl -i -k -X POST -d '<?xml version="1.0" encoding="UTF-8"?><payment><referenceNumber>89185561</referenceNumber><externalreferenceNumber>912f1663-3e4d-4204-bef7-fd8ee253f13e</externalreferenceNumber><paymentDate>02142024153110</paymentDate><status>ACCEPTED</status><amount>-150</amount></payment>' https://sizeup.firstduesizeup.com/fd-api/v1/paymentus/confirm-payment

#### Success Response

    HTTP/1.1 200 OK

#### Error Response

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "Invalid Request."
    }

    HTTP/1.1 404 Not Found
    {
      "code": 0,
      "message": "Invoice not found for invoice reference number: 912f1663-3e4d-4204-bef7-fd8ee253f13e."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Payment already processed./Refund already processed."
    }

### POST /fd-api/v1/device-locations

Post the current user/unit location.

    POST /fd-api/v1/device-locations

#### Parameters is an array of objects.

| Name              | Type    | Description                                                                      |
| ----------------- | :------ | :------------------------------------------------------------------------------- |
| email             | string  | **Required**. Device user email                                                  |
| device_id         | int     | **Required**. Device id                                                          |
| latitude          | numeric | **Required**. Device latitude                                                    |
| longitude         | numeric | **Required**. Device longitude                                                   |
| dispatch_id       | int     | Responding Dispatch Id                                                           |
| sync_time         | int     | Time (in seconds) until end synchronizing the device location                    |
| device_extra_info | string  | Additional information of several data delimited by a character (for example &). |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '[{"email": "DEVICE_USER_EMAIL", "device_id": "DEVICE_ID", "lat": 40.0, "lng": -120.0}]' https://sizeup.firstduesizeup.com/fd-api/v1/device-locations

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "success": true,
        "errors": []
      },
      {
        "success": false,
        "errors": ["Please provide email parameter."]
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": Validation Failed. Empty parameters.",
      "errors": []
    }

### GET /fd-api/v1/occupancies

Get occupancies. Request will be paginated to 20 items by default.

    GET /fd-api/v1/occupancies

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| page | int  | Page number |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode  https://sizeup.firstduesizeup.com/fd-api/v1/occupancies

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "occupancy_id": 14930699,
        "parcel_number": "0809003435",
        "local_id": null,
        "external_occupancy_id": null,
        "address_1": "100 BOSTON ST",
        "address_2": null,
        "city": "SEATTLE",
        "state": "WA",
        "zip": "98109",
        "occupancy_address": "100 BOSTON ST, SEATTLE, WA, 98109",
        "street_name": "BOSTON",
        "status_code": "active",
        "business_name": "Moorman Properties"
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

### GET /fd-api/v1/\_health

Get Stryker API health. Executes a basic health check of the service and provides the status.

    GET /fd-api/v1/_health

#### Example Request

    $ curl -i -k -H "x-api-key: 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/_health

#### Success Response

    HTTP/1.1 200 OK
    "OK - The service is healthy."

#### Error Response

    HTTP/1.1 401 Unauthorized
    "Unauthorized - The requester is not authenticated. This status may indicate that authentication credentials are invalid, malformed, or not provided. There is no need to retry the request because interface violations require changes on the client side, and invalid credentials are unlikely to become valid."

    HTTP/1.1 500 Internal Server Error
    "Internal Server Error - An unexpected error has occurred in the service while processing the request. It is recommended to retry the request 30 seconds later but not to execute more than 3 retries. Refer to the response content for more details regarding the error that occurred."

    HTTP/1.1 503 Service Unavailable
    "Service Unavailable - The service is temporarily unavailable due to maintenance or other reasons. It is recommended to retry the request one minute later."

### GET /fd-api/v1/\_health/deep

Get Stryker API health. Executes an advanced health check of the service and provides the status.

    GET /fd-api/v1/_health/deep

#### Example Request

    $ curl -i -k -H "x-api-key: 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/_health/deep

#### Success Response

    HTTP/1.1 200 OK
    "OK - The service is healthy."

#### Error Response

    HTTP/1.1 401 Unauthorized
    "Unauthorized - The requester is not authenticated. This status may indicate that authentication credentials are invalid, malformed, or not provided. There is no need to retry the request because interface violations require changes on the client side, and invalid credentials are unlikely to become valid."

    HTTP/1.1 500 Internal Server Error
    "Internal Server Error - An unexpected error has occurred in the service while processing the request. It is recommended to retry the request 30 seconds later but not to execute more than 3 retries. Refer to the response content for more details regarding the error that occurred."

    HTTP/1.1 503 Service Unavailable
    "Service Unavailable - The service is temporarily unavailable due to maintenance or other reasons. It is recommended to retry the request one minute later."

### PUT /fd-api/v1/patientRecords/:recordId

Upload patient record to Stryker API. Uploads a patient record.

    PUT /fd-api/v1/patientRecords/:recordId

#### Parameters

| Name          | Type     | Description    |
| :------------ | :------- | :------------- |
| patientRecord | stdClass | Patient record |

#### Example Request

    $ curl -i -k -H "x-api-key: 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/patientRecords/db9b692f-f57b-4d56-8501-82f6a9763ef8

#### Success Response

    HTTP/1.1 200 OK
    "OK - The patient record has been uploaded successfully."

#### Error Response

    HTTP/1.1 400 Bad request
    "Bad Request - The request is invalid or malformed. For example, some data is missing, or the data format is invalid. This includes issues with a request body and problems with request headers. Usually, this status indicates the wrong interface implementation on the client side. There is no need to retry the request because interface violations require changes on the client or service sides. Refer to the response content for more details regarding the interface violation."

    HTTP/1.1 401 Unauthorized
    "Unauthorized - The requester is not authenticated. This status may indicate that authentication credentials are invalid, malformed, or not provided. There is no need to retry the request because interface violations require changes on the client side, and invalid credentials are unlikely to become valid."

    HTTP/1.1 500 Internal Server Error
    "Internal Server Error - An unexpected error has occurred in the service while processing the request. It is recommended to retry the request 30 seconds later but not to execute more than 3 retries. Refer to the response content for more details regarding the error that occurred."

    HTTP/1.1 503 Service Unavailable
    "Service Unavailable - The service is temporarily unavailable due to maintenance or other reasons. It is recommended to retry the request one minute later."

### GET /fd-api/v1/get-hydrants

Get hydrants. Request will be return a hydrant or hydrant that match with the parameters.

    GET /fd-api/v1/get-hydrants

#### Parameters

Date parameters are in ISO 8601 in formatted datetime (YYYY-MM-DDTHH:MM:SS:Z).

| Name                | Type   | Description                                                                                                 |
| :------------------ | :----- | :---------------------------------------------------------------------------------------------------------- |
| id                  | int    | Hydrant id                                                                                                  |
| facility_code       | string | Facility Code                                                                                               |
| hydrant_status_code | string | Hydrant Status Code                                                                                         |
| hydrant_type_code   | string | Hydrant Type Code                                                                                           |
| fire_zone_id        | int    | Fire Zone Id                                                                                                |
| shift_id            | int    | Shift Id                                                                                                    |
| assigned_to_user    | int    | Assigned to User                                                                                            |
| assigned_to_team    | int    | Assigned to Team                                                                                            |
| service_date_to     | string | Only hydrants inspected at or before this time are returned. This is a timestamp in ISO 8601 format.        |
| service_date_from   | string | Only hydrants inspected at or after this time are returned. This is a timestamp in ISO 8601 format.         |
| flow_date_to        | string | Only hydrants last flow tested at or before this time are returned. This is a timestamp in ISO 8601 format. |
| flow_date_from      | string | Only hydrants last flow tested at or after this time are returned. This is a timestamp in ISO 8601 format.  |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "service_date_to=2019-02-15T19:00:00+00:00" "assigned_to_user=1" "facility_code=53/8" https://sizeup.firstduesizeup.test/fd-api/v1/get-hydrants

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "facility_code": "53/8",
        "id": 430945,
        "client_code": "THOMASVILLE",
        "hydrant_type_code": "HYDRANT",
        "year": null,
        "fort_lauderdale_owner_code": null,
        "latitude": "40.3499156",
        "longitude": "-75.9365641",
        "hydrant_status_code": "In service",
        "inspected_at": "2024-10-28T14:02:00+00:00",
        "area_ids_cache": "{5546}",
        "static_pressure": "123.00",
        "residual_pressure": "123.00",
        "residual_flow_rate": "123.00",
        "hydrant_type_name": "Hydrant",
        "address": null,
        "apparatus": null,
        "closest_address": null,
        "fire_zone": null,
        "inspected_by": "User #8377",
        "hydrant_zone": null,
        "xref_id": null,
        "base_color_code": "Class C Red less than 500 gpm - white outline",
        "manufacturer": "1997",
        "num_outlet": 3,
        "steamer_port": "4.5\"",
        "outlet_size2": "2.5\"",
        "outlet_size3": "2.5\"",
        "source": null,
        "location": "In front of 932 McKnight Street",
        "cistern_capacity_gallons": null,
        "main_size": null,
        "barrel_size": null,
        "last_flow_tested_at": "04/25/2024 09:45",
        "water_department": "RAWA",
        "model": null,
        "notes": null,
        "is_private": false,
        "cistern_capacity_liters": null,
        "calculated_flow_rate": "120.00",
        "fire_district": null,
        "valve_location": null,
        "placement": null,
        "fire_station": null,
        "shift": null,
        "assigned_user": null,
        "annual_maintenance": null,
        "reason_out_of_service": null,
        "hydrant_type_bg_color": null,
        "icon_file_path": null,
        "agency_name": "Thomasville",
        "flow_hydrant_one": "First Due ID: 566213",
        "flow_hydrant_two": "First Due ID: 566233",
        "pitot_gauge_one": 3,
        "pitot_gauge_two": 3,
        "team_id": 32,
        "assigned_team": "Team 3",
        "responsible_occupancy": null,
        "pressure_zone": null,
        "flowed_by": "User #8377"
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please provide valid parameters like (id, facility_code, hydrant_status_code, hydrant_type_code, fire_zone_id, shift_id, assigned_to_user, assigned_to_team, service_date_to, service_date_from, flow_date_to, flow_date_from)",
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please provide a valid parameter.",
      "errors": [
        {
          "field": "service_date_from",
          "code": "invalid",
          "message": "Invalid service date from parameter."
        }
      ]
    }

### GET /fd-api/v1/get-hydrant-services

Get hydrant services. Request will be return a hydrant service or services that match with the parameters.

    GET /fd-api/v1/get-hydrant-services

#### Parameters

Date parameters are in ISO 8601 in formatted datetime (YYYY-MM-DDTHH:MM:SS:Z).

| Name              | Type   | Description                                                                                          |
| :---------------- | :----- | :--------------------------------------------------------------------------------------------------- |
| firstdue_id       | int    | Firstdue Id                                                                                          |
| facility_code     | string | Facility Code                                                                                        |
| hydrant_id        | string | Hydrant Id                                                                                           |
| completed_at_from | string | Only hydrants completed at or before this time are returned. This is a timestamp in ISO 8601 format. |
| completed_at_to   | string | Only hydrants completed at or after this time are returned. This is a timestamp in ISO 8601 format.  |
| most_recent       | bool   | Available values 0 (false) or 1 (true)                                                               |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "service_date_to=2019-02-15T19:00:00+00:00" "assigned_to_user=1" "facility_code=53/8" https://sizeup.firstduesizeup.test/fd-api/v1/get-hydrants

#### Success Response

    HTTP/1.1 200 OK
    [
      "completed_date": "2024-10-23T21:54:55+00:00",
        "firstdue_id": 430945,
        "facility_id": "53/8",
        "hydrant_id": null,
        "hydrant_type_name": "Hydrant",
        "checklist_name": "Checklist Test",
        "activity_date": null,
        "questions": [
            {
                "question": "[Checklist 1] Is good?",
                "answer": "Test 1; Test 2; Test 3"
            },
            {
                "question": "[Checklist 3] Color",
                "answer": "Brown"
            },
            {
                "question": "[Checklist 3] Hydrant Type",
                "answer": "Hydrant"
            },
            {
                "question": "[Checklist 3] Static Pressure",
                "answer": "2234"
            },
            {
                "question": "[checklist 4] residual Pressure",
                "answer": "34543"
            },
            {
                "question": "[checklist 4] Calculated Flow",
                "answer": "345"
            },
            {
                "question": "[checklist 4] Flow hydrant",
                "answer": "345"
            },
            {
                "question": "[checklist 4] Pass and fail 4",
                "answer": "Fail"
            }
        ]
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please provide valid parameters like (firstdue_id, facility_code, hydrant_id, most_recent, completed_at_from, completed_at_to)",
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please provide a valid parameter.",
      "errors": [
        {
          "field": "completed_at_from",
          "code": "invalid",
          "message": "Invalid completed date from parameter."
        }
      ]
    }

### GET /fd-api/v1/get-hydrant-flow-tests

Get hydrant flow tests. Request will be return a hydrant flow test or flow tests that match with the parameters.

    GET /fd-api/v1/get-hydrant-flow-tests

#### Parameters

Date parameters are in ISO 8601 in formatted datetime (YYYY-MM-DDTHH:MM:SS:Z).

| Name              | Type   | Description                                                                                          |
| :---------------- | :----- | :--------------------------------------------------------------------------------------------------- |
| firstdue_id       | int    | Firstdue Id                                                                                          |
| facility_code     | string | Facility Code                                                                                        |
| hydrant_id        | string | Hydrant Id                                                                                           |
| completed_at_from | string | Only hydrants completed at or before this time are returned. This is a timestamp in ISO 8601 format. |
| completed_at_to   | string | Only hydrants completed at or after this time are returned. This is a timestamp in ISO 8601 format.  |
| most_recent       | bool   | Available values 0 (false) or 1 (true)                                                               |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "completed_at_to=2019-02-15T19:00:00+00:00" "facility_code=53/8" https://sizeup.firstduesizeup.test/fd-api/v1/get-hydrant-flow-tests

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "firstdue_id": 430945,
        "facility_id": "53/8",
        "hydrant_id": null,
        "nearest_address": null,
        "flow_test_number": "TF-2025-0000001",
        "completed_date": "2025-01-06T22:45:43+00:00",
        "flow_tested_at": "2025-01-06T15:44:00+00:00",
        "static_pressure": "2.00",
        "maximum_test_residual_pressure": "1.00",
        "residual_pressure": "1.00",
        "drop": 1,
        "differential": 50,
        "flow_rates": {
            "twenty": 0,
            "ten": 0,
            "zero": 1489
        },
        "hydrant_flows": [
            {
                "id": 26,
                "hydrant_id": 430945,
                "discharges": [
                    {
                        "flow": "787.3",
                        "coefficient": 0.9,
                        "outlet_size": 2.5,
                        "pitot_gauge": "22"
                    },
                    {
                        "flow": "237.4",
                        "coefficient": 0.9,
                        "outlet_size": 2.5,
                        "pitot_gauge": "2"
                    }
                ],
                "facility_id": "53/8",
                "nearest_address": null,
                "total_flow": 1024.7
            }
        ],
        "department_members": "Camilo, First #10032 Last #10032, First #10094 Last #10094, First #10095 Last #10095, User #8377",
        "outside_agencies": null,
        "total_flow": 1024.7,
        "other_participants": null
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please provide valid parameters like (firstdue_id, facility_code, hydrant_id, most_recent, completed_at_from, completed_at_to)",
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please provide a valid parameter.",
      "errors": [
        {
          "field": "completed_at_from",
          "code": "invalid",
          "message": "Invalid completed date from parameter."
        }
      ]
    }

### POST /fd-api/v1/set-hydrant-status

Set hydrant status.

    POST /fd-api/v1/set-hydrant-status

#### Parameters

| Name        | Type    | Description                                                                     |
| :---------- | :------ | :------------------------------------------------------------------------------ |
| hydrant_id  | integer | Hydrant Id                                                                      |
| status_code | string  | Desired hydrant status code. Possible values (in_service, out_of_service, null) |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"hydrant_id": 12345, "status_code": "in_service"}' https://sizeup.firstduesizeup.com/fd-api/v1/set-hydrant-status

#### Success Response

    HTTP/1.1 200 OK

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": 'Please provide valid parameters'
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": 'Invalid hydrant id parameter'
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": 'Invalid status code parameter'
    }

### POST /fd-api/v1/update-hydrant-work-order

Set hydrant status.

    POST /fd-api/v1/update-hydrant-work-order

#### Parameters

| Name              | Type    | Description                                                  |
| :---------------- | :------ | :----------------------------------------------------------- |
| hydrant_id        | integer | Hydrant id                                                   |
| work_order_number | integer | Work order number                                            |
| eta_date          | string  | Work order ETA date. This is a timestamp in ISO 8601 format. |
| work_performed    | string  | Work performed                                               |
| phase_id          | integer | Phase id                                                     |
| board_id          | integer | Board id                                                     |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"hydrant_id": 1051234, "work_order_number": 10, "eta_date": "2024-12-25T00:00:00+00:00", "work_performed": "test", "phase_id": 5}' https://sizeup.firstduesizeup.com/fd-api/v1/update-hydrant-work-order

#### Success Response

    HTTP/1.1 200 OK

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": 'Please provide valid parameters'
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please provide a valid parameter.",
      "errors": [
        {
          "field": "hydrant_id",
          "code": "invalid",
          "message": "Hydrant parameter is invalid"
        },
        {
          "field": "work_order_number",
          "code": "invalid",
          "message": "Work order number parameter is invalid"
        },
        {
          "field": "eta_date",
          "code": "invalid",
          "message": "Invalid eta date from parameter."
        }
      ]
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": 'Please provide valid work order phase parameters'
    }

### POST /fd-api/v1/create-hydrant-work-order

Set hydrant status.

    POST /fd-api/create-hydrant-work-order

#### Parameters

| Name                     | Type    | Description                                                  |
| :----------------------- | :------ | :----------------------------------------------------------- |
| hydrant_id               | integer | Hydrant id (Required)                                        |
| phase_id                 | integer | Phase id (Required)                                          |
| board_id                 | integer | Board id (Required)                                          |
| submitted_by             | integer | Submitted by id (Required)                                   |
| type_id                  | integer | Work order type id (Required)                                |
| summary                  | string  | Work Order summary(Required)                                 |
| eta_date                 | string  | Work order ETA date. This is a timestamp in ISO 8601 format. |
| work_performed           | string  | Work performed                                               |
| description              | string  | Description                                                  |
| is_change_hydrant_status | boolean | If is true change the hydrant status to out of service       |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"hydrant_id": 1051234, "eta_date": "2024-12-25T00:00:00+00:00", "work_performed": "test", "phase_id": 5, "type_id": 3, "submitted_by": 8377, "summary": "new test from fd_api"}' https://sizeup.firstduesizeup.com/fd-api/v1/create-hydrant-work-order

#### Success Response

    HTTP/1.1 200 OK

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": 'Please provide required parameters (submitted_by, phase_id, type_id, hydrant_id, summary)'
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please provide a valid parameter.",
      "errors": [
        {
          "field": "hydrant_id",
          "code": "invalid",
          "message": "Please provide valid hydrant parameters"
        },
        {
          "field": "phase_id",
          "code": "invalid",
          "message": "Please provide valid hydrant work order phase parameters"
        },
        {
          "field": "type_id",
          "code": "invalid",
          "message": "Please provide valid hydrant work order type parameters"
        },
        {
          "field": "submitted_by",
          "code": "invalid",
          "message": "Please provide valid submitted by parameters"
        },
        {
          "field": "eta_date",
          "code": "invalid",
          "message": "Invalid eta date from parameter."
        }
      ]
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Can`t create hydrant work order"
    }

### GET /fd-api/v1/fdids

Get a FDID list.

    GET /fd-api/v1/fdids

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/fdids

#### Success Response

    HTTP/1.1 200 OK
    {
      "list": [
        {
          "uuid": "4cee4bad-429d-465b-9c58-61d40fe728cf",
          "fdid": "09229",
          "name": "FDID1",
          "is_enabled": true,
          "is_default": false
        },
        {
          "uuid": "e1a10b81-ea5d-4b1a-8233-b84bed6a9f94",
          "fdid": "00122",
          "name": "FDID2",
          "is_enabled": true,
          "is_default": true
        }
      ],
      "total": 2
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/stations

Get a Fire Station list.

    GET /fd-api/v1/stations

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/stations

#### Success Response

    HTTP/1.1 200 OK
    {
      "list": [
        {
            "uuid": "6db68f01-943d-442f-9a10-bad0fbb048cb",
            "name": "Station 1"
        },
        {
            "uuid": "7c66149f-9660-4649-baba-46b57060ac11",
            "name": "Station 2"
        }
      ],
      "total": 2
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/shifts

Get a Battalion Department Shift list.

    GET /fd-api/v1/shifts

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/shifts

#### Success Response

    HTTP/1.1 200 OK
    {
      "list": [
        {
            "uuid": "ebe05dbe-185b-4ada-9e8f-de40f1d6f73a",
            "name": "Shift 1"
        },
        {
            "uuid": "7656306e-38be-44cf-ae22-e9b0647fc9ed",
            "name": "Shift 2"
        }
      ],
      "total": 2
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/response-zones

Get a Battalion Department Response Zone list.

    GET /fd-api/v1/response-zones

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/response-zones

#### Success Response

    HTTP/1.1 200 OK
    {
      "list": [
        {
            "uuid": "4d2cd84a-ce18-4e85-92b6-c3df39347374",
            "name": "Response zone 1"
        },
        {
            "uuid": "4367f65c-9ca2-4993-957f-b382c7ec51fc",
            "name": "Response zone 2"
        }
      ],
      "total": 2
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/aid-departments

Get a Battalion Department Aid list.

    GET /fd-api/v1/aid-departments

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/aid-departments

#### Success Response

    HTTP/1.1 200 OK
    {
      "list": [
        {
          "uuid": "1d5cbc85-34c1-4847-b439-37d2ff1d3d45",
          "fdid": "00122",
          "name": "Fire Department 1",
          "aid_type": "Manual"
        },
        {
          "uuid": "df8dd6d3-6fc6-42fe-96a4-c94a087caf38",
          "fdid": "01525",
          "name": "Fire Department 2",
          "aid_type": "Automatic"
        },
        {
          "uuid": "e1858558-05c0-4721-a384-2f005ff22233",
          "fdid": "88111",
          "name": "Fire Department 3",
          "aid_type": "Both"
        }
      ],
      "total": 3
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/apparatuses

Get a Apparatus list.

    GET /fd-api/v1/apparatuses

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/apparatuses

#### Success Response

    HTTP/1.1 200 OK
    {
      "list": [
        {
          "uuid": "e9f3baf8-2880-4d82-9c7f-79e0ea4e20bc",
          "name": "Ambulance 1",
          "unit_code": "AMB1",
          "use_code": "2",
          "use_name": "EMS"
        },
        {
          "uuid": "f8813126-d976-41ff-81c0-adf8b3290d20",
          "name": "Ambulance 2",
          "unit_code": "AMB2",
          "use_code": "2",
          "use_name": "EMS"
        },
        {
          "uuid": "9824bc40-baa0-4c12-8aa7-3b930c194c93",
          "name": "Engine 1",
          "unit_code": "PE1",
          "use_code": "1",
          "use_name": "Suppression"
        }
      ],
      "total": 3
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/personnel

Get a Personnel list.

    GET /fd-api/v1/personnel

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/personnel

#### Success Response

    HTTP/1.1 200 OK
    {
      "list": [
        {
          "uuid": "4d2cd84a-ce18-4e85-92b6-c3df39347374",
          "full_name": "Jared A Barron",
          "first_name": "Jared",
          "middle_name": "A",
          "last_name": "Barron"
        },
        {
          "uuid": "c6d8cb63-13c5-4966-8a50-0742e0093af0",
          "full_name": "Gisela Weiss",
          "first_name": "Gisela",
          "middle_name": "",
          "last_name": "Weiss"
        }
      ],
      "total": 2
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### GET /fd-api/v1/incident-reports/:incident_report_uuid

Get a Fire Incident Report.

    GET /fd-api/v1/incident-reports/:incident_report_uuid

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports/d8b49763-dda7-46f7-9f48-e07e6c5f2506

#### Success Response

    HTTP/1.1 200 OK
    {
      "uuid": "d8b49763-dda7-46f7-9f48-e07e6c5f2506",
      "incident_number": "PF-2024-0000145",
      "alarm_at": "2024-09-02 05:03:24",
      "dispatch_number": "20240731121231",
      "incident_type": "320",
      "location_type": "2",
      "property_type": "110",
      "fdid": "781695aa-6fbb-4686-8759-08ccc0fad06f",
      "fdid_name": "FDID 1",
      "station": "6db68f01-943d-442f-9a10-bad0fbb048cb",
      "station_name": "Station 1",
      "shift": "6f536c34-3651-4a79-b6fd-6f1d7f15be3d",
      "shift_name": "Shift 1",
      "response_zone": "4367f65c-9ca2-4993-957f-b382c7ec51fc",
      "response_zone_name": "Response zone 1",
      "aid_given_received": true,
      "aid_type_code": 4,
      "aid_department": "e1858558-05c0-4721-a384-2f005ff22233",
      "aid_department_name": "First Received",
      "latitude": "70.1111111",
      "longitude": "-170.1111110",
      "narratives": "New Narratives",
      "incident_status": "incomplete",
      "actions_taken": "10,12,13",
      "street_address": "1020 HOLT DR",
      "city": "Placentia",
      "state_code": "CA",
      "zip_code": "23323",
      "officer_in_charge_name": "Gary Oldman",
      "officer_in_charge": "d9d5f7f0-0d38-4000-a463-75b3b266ea87",
      "officer_making_report_name": "William Deffoe",
      "officer_making_report": "c6d8cb63-13c5-4966-8a50-0742e0093af0",
      "apparatus": [
        {
          "uuid": "6dbf31d2-01bd-472c-be35-18592c8e92c5",
          "apparatus_name": "Ambulance 1",
          "apparatus_use": "2 - EMS",
          "number_of_people": 1,
          "dispatch_at": "2024-11-20T16:08:15+00:00",
          "dispatch_acknowledged_at": "2024-11-20T16:08:15+00:00",
          "enroute_at": "2024-11-20T16:08:15+00:00",
          "arrive_at": "2024-11-20T16:08:15+00:00",
          "arrived_patient_at": "2024-11-20T16:08:15+00:00",
          "transfer_of_care_at": "2024-11-20T16:08:15+00:00",
          "unit_canceled": false,
          "canceled_at": null,
          "canceled_stage_code": null,
          "clear_at": "2024-11-20T16:08:15+00:00",
          "back_in_service_at": "2024-11-20T16:08:15+00:00",
          "personnel": [
            {
              "uuid": "61ed824a-ecf8-4a3f-96f9-30d28d15b843",
              "full_name": "Gary Oldman",
              "first_name": "Gary",
              "middle_name": "",
              "last_name": "Oldman",
              "apparatus_name": "Ambulance 1",
              "apparatus_use": "2 - EMS"
            }
          ]
        }
      ]
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: d8b49763-dda7-46f7-9f48-e07e6c5f2506 does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: d8b49763-dda7-46f7-9f48-e07e6c5f2506 already exists and it is deleted."
    }

### POST /fd-api/v1/incident-reports

Create a Fire Incident Report.

    POST /fd-api/v1/incident-reports

#### Parameters

| Name                          | Type    | Description                                           |
| :---------------------------- | :------ | :---------------------------------------------------- |
| incident_number               | string  | **Required**. Incident Report                         |
| alarm_at                      | string  | **Required**. Alarm At date                           |
| dispatch_number               | string  | Dispatch Number                                       |
| incident_type                 | int     | **Required**. Incident Type                           |
| fdid                          | string  | **Required**. FDID UUID                               |
| station                       | string  | **Required**. Fire Station UUID                       |
| shift                         | string  | **Required**. Battalion Department Shift UUID         |
| response_zone                 | string  | **Required**. Battalion Department Response Zone UUID |
| aid_given_received            | boolean | **Required**. (true or false) Aid Given Received      |
| aid_type_code                 | int     | Aid Type Code                                         |
| aid_department                | string  | Aid Departament UUID                                  |
| incident_number_receiving_aid | string  | Incident Number of Receiving Aid                      |
| actions_taken                 | array   | Overall Departmental Actions Taken. Format: "1,2,3,5" |
| officer_in_charge             | string  | Officer In Charge. (Personnel UUID)                   |
| officer_making_report         | string  | Officer making Report (Personnel UUID)                |
| narratives                    | string  | Narratives                                            |
| street_address                | string  | Street Address                                        |
| city                          | string  | City                                                  |
| state_code                    | string  | State Code. (2 characters)                            |
| zip_code                      | string  | Zip Code                                              |
| location_type                 | int     | Location Type Code                                    |
| property_type                 | int     | Property Type Code                                    |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"incident_number": "PF-2024-0000145", "alarm_at": "2024-09-02T15:03:24:+00:00", "dispatch_number": "20240731121231", "incident_type": 320, "fdid": "4d2cd84a-ce18-4e85-92b6-c3df39347374", "station": "6db68f01-943d-442f-9a10-bad0fbb048cb", "shift": "6f536c34-3651-4a79-b6fd-6f1d7f15be3d", "response_zone": "4367f65c-9ca2-4993-957f-b382c7ec51fc", "aid_given_received": "true", "aid_type_code": 4, "aid_department": "e1858558-05c0-4721-a384-2f005ff22233", "incident_number_receiving_aid": "15365", "actions_taken": "10,12,20", "officer_in_charge": "d9d5f7f0-0d38-4000-a463-75b3b266ea87", "officer_making_report": "c6d8cb63-13c5-4966-8a50-0742e0093af0", "narratives": "Narrative text", "street_address": "1020 HOLT DR", "city": "Placentia", "state_code": "CA", "zip_code": "23323", "location_type": 6, "property_type": 110}' https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports

#### Success Response

    HTTP/1.1 200 OK
    {
      "uuid": "d8b49763-dda7-46f7-9f48-e07e6c5f2506",
      "incident_number": "PF-2024-0000145",
      "alarm_at": "2024-09-02T15:03:24:+00:00",
      "dispatch_number": "20240731121231",
      "incident_type": "320",
      "location_type": "2",
      "property_type": "110",
      "fdid": "781695aa-6fbb-4686-8759-08ccc0fad06f",
      "fdid_name": "FDID 1",
      "station": "6db68f01-943d-442f-9a10-bad0fbb048cb",
      "station_name": "Station 1",
      "shift": "6f536c34-3651-4a79-b6fd-6f1d7f15be3d",
      "shift_name": "Shift 1",
      "response_zone": "4367f65c-9ca2-4993-957f-b382c7ec51fc",
      "response_zone_name": "Response zone 1",
      "aid_given_received": true,
      "aid_type_code": 4,
      "aid_department": "e1858558-05c0-4721-a384-2f005ff22233",
      "aid_department_name": "First Received",
      "latitude": "70.1111111",
      "longitude": "-170.1111110",
      "narratives": "New Narratives",
      "incident_status": "incomplete",
      "actions_taken": "10,12,13",
      "street_address": "1020 HOLT DR",
      "city": "Placentia",
      "state_code": "CA",
      "zip_code": "23323",
      "officer_in_charge_name": "Gary Oldman",
      "officer_in_charge": "d9d5f7f0-0d38-4000-a463-75b3b266ea87",
      "officer_making_report_name": "William Deffoe",
      "officer_making_report": "c6d8cb63-13c5-4966-8a50-0742e0093af0",
      "apparatus": [
        {
          "uuid": "6dbf31d2-01bd-472c-be35-18592c8e92c5",
          "apparatus_name": "Ambulance 1",
          "apparatus_use": "2 - EMS",
          "number_of_people": 1,
          "dispatch_at": "2024-09-02T15:03:24:+00:00",
          "dispatch_acknowledged_at": "2024-09-02T15:03:24:+00:00",
          "enroute_at": "2024-09-02T15:03:24:+00:00",
          "arrive_at": "2024-09-02T15:03:24:+00:00",
          "arrived_patient_at": "2024-09-02T15:03:24:+00:00",
          "transfer_of_care_at": "2024-09-02T15:03:24:+00:00",
          "unit_canceled": false,
          "canceled_at": null,
          "canceled_stage_code": null,
          "clear_at": "2024-09-02T15:03:24:+00:00",
          "back_in_service_at": "2024-09-02T15:03:24:+00:00",
          "personnel": [
            {
              "uuid": "61ed824a-ecf8-4a3f-96f9-30d28d15b843",
              "full_name": "Gary Oldman",
              "first_name": "Gary",
              "middle_name": "",
              "last_name": "Oldman",
              "apparatus_name": "Ambulance 1",
              "apparatus_use": "2 - EMS"
            }
          ]
        }
      ]
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The NFIRS Notification for number PF-2024-0000144 on the date 2024-09-02 does not exist."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "The Incident Report for number PF-2024-0000145 on the date 2024-09-02 already exists."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: d8b49763-dda7-46f7-9f48-e07e6c5f2506 already exists and it is deleted."
    }

### PUT /fd-api/v1/incident-reports/:incident_report_uuid

Update a Fire Incident Report item completely.

    PUT /fd-api/v1/incident-reports/:incident_report_uuid

#### Parameters

| Name                          | Type    | Description                                           |
| :---------------------------- | :------ | :---------------------------------------------------- |
| dispatch_number               | string  | Dispatch Number                                       |
| incident_type                 | int     | **Required**. Incident Type                           |
| fdid                          | string  | **Required**. FDID UUID                               |
| station                       | string  | **Required**. Fire Station UUID                       |
| shift                         | string  | **Required**. Battalion Department Shift UUID         |
| response_zone                 | string  | **Required**. Battalion Department Response Zone UUID |
| aid_given_received            | boolean | **Required**. (true or false) Aid Given Received      |
| aid_type_code                 | int     | Aid Type Code                                         |
| aid_department                | string  | Aid Departament UUID                                  |
| incident_number_receiving_aid | string  | Incident Number of Receiving Aid                      |
| actions_taken                 | array   | Overall Departmental Actions Taken. Format: "1,2,3,5" |
| officer_in_charge             | string  | Officer In Charge. (Personnel UUID)                   |
| officer_making_report         | string  | Officer Making Report (Personnel UUID)                |
| narratives                    | string  | Narratives                                            |
| street_address                | string  | Street Address                                        |
| city                          | string  | City                                                  |
| state_code                    | string  | State Code. (2 characters)                            |
| zip_code                      | string  | Zip Code                                              |
| location_type                 | int     | Location Type Code                                    |
| property_type                 | int     | Property Type Code                                    |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"dispatch_number": "20240731121231", "incident_type": 320, "fdid": "4d2cd84a-ce18-4e85-92b6-c3df39347374", "station": "6db68f01-943d-442f-9a10-bad0fbb048cb", "shift": "6f536c34-3651-4a79-b6fd-6f1d7f15be3d", "response_zone": "4367f65c-9ca2-4993-957f-b382c7ec51fc", "aid_given_received": "true", "aid_type_code": 4, "aid_department": "e1858558-05c0-4721-a384-2f005ff22233", "incident_number_receiving_aid": "15365", "actions_taken": "10,12,20", "officer_in_charge": "d9d5f7f0-0d38-4000-a463-75b3b266ea87", "officer_making_report": "c6d8cb63-13c5-4966-8a50-0742e0093af0", "narratives": "Narrative text", "street_address": "1020 HOLT DR", "city": "Placentia", "state_code": "CA", "zip_code": "23323", "location_type": 6, "property_type": 110}' https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: d8b49763-dda7-46f7-9f48-e07e6c5f2506 already exists and it is deleted."
    }

### DELETE /fd-api/v1/incident-reports/:incident_report_uuid

Delete a Fire Incident Report item.

    DELETE /fd-api/v1/incident-reports/:incident_report_uuid

#### Parameters

| Name                 | Type   | Description        |
| :------------------- | :----- | :----------------- |
| incident_report_uuid | string | **Required**. uuid |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports/9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: d8b49763-dda7-46f7-9f48-e07e6c5f2506 already exists and it is deleted."
    }

### PATCH /fd-api/v1/incident-reports/:incident_report_uuid/authorize

Authorize a Fire Incident Report item.

    PATCH /fd-api/v1/incident-reports/:incident_report_uuid/authorize

#### Parameters

| Name                 | Type   | Description        |
| :------------------- | :----- | :----------------- |
| incident_report_uuid | string | **Required**. uuid |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PATCH https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports/9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: d8b49763-dda7-46f7-9f48-e07e6c5f2506 already exists and it is deleted."
    }

### GET /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses

Get Incident Report Apparatus List by Incident Report UUID.

    GET /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports/9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc/apparatuses

#### Success Response

    HTTP/1.1 200 OK
    {
        "list": [
            {
                "uuid": "217f0118-8dae-4535-8aeb-e98f84ef4671",
                "apparatus_name": "Ambulance 1",
                "apparatus_use": "2 - EMS",
                "number_of_people": 1,
                "dispatch_at": "2024-09-09T01:23:36+00:00",
                "dispatch_acknowledged_at": "2024-09-09T01:23:37",
                "enroute_at": "2024-09-09T01:23:38+00:00",
                "arrive_at": "2024-09-09T01:23:46+00:00",
                "arrived_patient_at": "2024-09-09T01:23:47+00:00",
                "transfer_of_care_at": "2024-09-09T01:23:48+00:00",
                "unit_canceled": false,
                "canceled_at": null,
                "canceled_stage_code": null,
                "clear_at": "2024-09-09T01:23:49+00:00",
                "back_in_service_at": "2024-09-09T01:23:49+00:00",
                "personnel": []
            },
            {
                "uuid": "d2424c6f-5523-4504-8cc3-7de6848d53d6",
                "apparatus_name": "Ambulance 2",
                "apparatus_use": "2 - EMS",
                "number_of_people": 0,
                "dispatch_at": "2024-09-09T01:23:36",
                "dispatch_acknowledged_at": "2024-09-09T01:23:37+00:00",
                "enroute_at": "2024-09-09T01:23:38+00:00",
                "arrive_at": null,
                "arrived_patient_at": "2024-09-09T01:23:47+00:00",
                "transfer_of_care_at": "2024-09-09T01:23:48+00:00",
                "unit_canceled": true,
                "canceled_at": "2024-09-08T19:23:49+00:00",
                "canceled_stage_code": "while_en_route",
                "clear_at": null,
                "back_in_service_at": null,
                "personnel": [
                  {
                      "uuid": "61ed824a-ecf8-4a3f-96f9-30d28d15b843",
                      "full_name": "Gary Oldman",
                      "first_name": "Gary",
                      "middle_name": "",
                      "last_name": "Oldman",
                      "apparatus_name": "Ambulance 1",
                      "apparatus_use": "2 - EMS"
                  }
              ]
            }
        ],
        "total": 2
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc already exists and it is deleted."
    }

### GET /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:uuid

Get Incident Report Apparatus by Incident Report UUID and Incident Report Apparatus UUID.

    GET /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:uuid

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports/9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc/apparatuses/217f0118-8dae-4535-8aeb-e98f84ef4671

#### Success Response

    HTTP/1.1 200 OK
    {
      "uuid": "217f0118-8dae-4535-8aeb-e98f84ef4671",
      "apparatus_name": "Ambulance 1",
      "apparatus_use": "2 - EMS",
      "number_of_people": 0,
      "dispatch_at": "2024-09-09T01:23:36+00:00",
      "dispatch_acknowledged_at": "2024-09-09T01:23:37+00:00",
      "enroute_at": "2024-09-09T01:23:38+00:00",
      "arrive_at": "2024-09-09T01:23:46+00:00",
      "arrived_patient_at": "2024-09-09T01:23:47+00:00",
      "transfer_of_care_at": "2024-09-09T01:23:48+00:00",
      "unit_canceled": false,
      "canceled_at": null,
      "canceled_stage_code": null,
      "clear_at": "2024-09-09T01:23:49+00:00",
      "back_in_service_at": "2024-09-09T01:23:49+00:00"
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc already exists and it is deleted."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report Apparatus for UUID: 217f0118-8dae-4535-8aeb-e98f84ef4671 does not exist."
    }

### POST /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses

Create a Incident Report Apparatus.

    POST /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses

#### Parameters

| Name                     | Type    | Description                                                        |
| :----------------------- | :------ | :----------------------------------------------------------------- |
| apparatus_uuid           | string  | **Required**. Apparatus UUID                                       |
| unit_aid                 | boolean | Unit Aid (true or false)                                           |
| unit_use                 | int     | Unit Use                                                           |
| dispatch_at              | string  | **Required**. Dispatch At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| dispatch_acknowledged_at | string  | Dispatch Acknowledged At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| enroute_at               | string  | **Required**. EnRoute At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| arrive_at                | string  | **Required**. Arrive At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)   |
| arrived_patient_at       | string  | Arrive Patient At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)         |
| transfer_of_care_at      | string  | Transferred Of Care At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)    |
| clear_at                 | string  | **Required**. Clear At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)    |
| back_in_service_at       | string  | Back In Service. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)           |
| unit_canceled            | boolean | Unit Canceled (true or false)                                      |
| canceled_at              | string  | Unit Canceled At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)          |
| canceled_stage_code      | string  | Canceled Stage Code                                                |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"apparatus_uuid": "9824bc40-baa0-4c12-8aa7-3b930c194c93", "unit_aid": false, "unit_use": 1, "dispatch_at": "2024-09-09T01:23:36+00:00", "dispatch_acknowledged_at": "2024-09-09T07:23:37+00:00", "enroute_at": "2024-09-09T07:23:38+00:00", "arrive_at": "2024-09-09T07:23:46+00:00", "arrived_patient_at":  "2024-09-09 T07:23:47+00:00", "transfer_of_care_at": "2024-09-09T07:23:48+00:00", "clear_at": "2024-09-09T07:23:49+00:00", "back_in_service_at": null, "unit_canceled": true, "canceled_at": "2024-09-09T07:23:50+00:00", "canceled_stage_code": "while_en_route"}' https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports/9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc/apparatuses

#### Success Response

    HTTP/1.1 200 OK
    {
      "uuid": "a8cd4a17-d3f6-4ef2-8f20-d7336fa90f73",
      "apparatus_name": "Ambulance 2",
      "apparatus_use": "2 - EMS",
      "number_of_people": 0,
      "dispatch_at": "2024-09-09T01:23:36+00:00",
      "dispatch_acknowledged_at": "2024-09-09T07:23:37+00:00",
      "enroute_at": "2024-09-09T01:23:38+00:00",
      "arrive_at": "2024-09-09T07:23:46+00:00",
      "arrived_patient_at": "2024-09-09T01:23:47+00:00",
      "transfer_of_care_at": "2024-09-09T01:23:48+00:00",
      "unit_canceled": true,
      "canceled_at": "2024-09-09T01:23:50+00:00",
      "canceled_stage_code": "while_en_route",
      "clear_at": "2024-09-09T07:23:49+00:00",
      "back_in_service_at": null
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc already exists and it is deleted."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Apparatus for UUID: 9824bc40-baa0-4c12-8aa7-3b930c194c93 does not exist."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "The Apparatus for UUID: 9824bc40-baa0-4c12-8aa7-3b930c194c93 already exists in this report."
    }

### PUT /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:uuid

Update Incident Report Apparatus item completely.

    PUT /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:uuid

#### Parameters

| Name                     | Type    | Description                                                        |
| :----------------------- | :------ | :----------------------------------------------------------------- |
| unit_aid                 | boolean | Unit Aid (true or false)                                           |
| unit_use                 | int     | Unit Use                                                           |
| dispatch_at              | string  | **Required**. Dispatch At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| dispatch_acknowledged_at | string  | Dispatch Acknowledged At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| enroute_at               | string  | **Required**. EnRoute At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)  |
| arrive_at                | string  | **Required**. Arrive At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)   |
| arrived_patient_at       | string  | Arrive Patient At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)         |
| transfer_of_care_at      | string  | Transferred Of Care At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)    |
| clear_at                 | string  | **Required**. Clear At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)    |
| back_in_service_at       | string  | Back In Service. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)           |
| unit_canceled            | boolean | Unit Canceled (true or false)                                      |
| canceled_at              | string  | Unit Canceled At. Format Datetime (YYYY-MM-DDTHH:MM:SS:Z)          |
| canceled_stage_code      | string  | Canceled Stage Code                                                |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"unit_aid": false, "unit_use": 1, "dispatch_at": "2024-09-09T07:23:36+00:00", "dispatch_acknowledged_at": "2024-09-09T07:23:37+00:00", "enroute_at": "2024-09-09T07:23:38+00:00", "arrive_at": "2024-09-09T07:23:46+00:00", "arrived_patient_at": "2024-09-09T07:23:47+00:00", "transfer_of_care_at": "2024-09-09T07:23:48+00:00", "clear_at": "2024-09-09T07:23:49+00:00", "back_in_service_at": "2024-09-09T07:23:49+00:00", "unit_canceled": true, "canceled_at": "2024-09-09T07:23:50+00:00", "canceled_stage_code": "while_en_route"}' https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports/9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc/apparatuses/217f0118-8dae-4535-8aeb-e98f84ef4671

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc already exists and it is deleted."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report Apparatus for UUID: 9824bc40-baa0-4c12-8aa7-3b930c194c93 does not exist."
    }

### DELETE /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:uuid

Delete Incident Report Apparatus item.

    DELETE /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:uuid

#### Parameters

| Name                 | Type   | Description                                  |
| :------------------- | :----- | :------------------------------------------- |
| incident_report_uuid | string | **Required**. Incident Report UUID           |
| uuid                 | string | **Required**. Incident Report Apparatus UUID |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports/9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc/apparatuses/217f0118-8dae-4535-8aeb-e98f84ef4671

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc already exists and it is deleted."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report Apparatus for UUID: 217f0118-8dae-4535-8aeb-e98f84ef4671 does not exist."
    }

### GET /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:incident_report_apparatus_uuid/personnel/:uuid

Get Incident Report Personnel by Incident Report UUID, Incident Report Apparatus UUID and Incident Report Personnel UUID

    GET /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:incident_report_apparatus_uuid/personnel/:uuid

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports/9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc/apparatuses/217f0118-8dae-4535-8aeb-e98f84ef4671/personnel/af4246e3-1e70-455d-aef4-d69c23c9ca83

#### Success Response

    HTTP/1.1 200 OK
    {
      "uuid": "af4246e3-1e70-455d-aef4-d69c23c9ca83",
      "full_name": "Gary A Oldman",
      "first_name": "Gary",
      "middle_name": "A",
      "last_name": "Oldman",
      "apparatus_name": "Ambulance 1",
      "apparatus_use": "2 - EMS"
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc already exists and it is deleted."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report Apparatus for UUID: 217f0118-8dae-4535-8aeb-e98f84ef4671 does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report personnel for UUID: af4246e3-1e70-455d-aef4-d69c23c9ca83 does not exist."
    }

### POST /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:incident_report_apparatus_uuid/personnel

Create a Incident Report Personnel.

    POST /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:incident_report_apparatus_uuid/personnel

#### Parameters

| Name           | Type   | Description                    |
| :------------- | :----- | :----------------------------- |
| personnel_uuid | string | **Required**. (Personnel UUID) |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"personnel_uuid": "9824bc40-baa0-4c12-8aa7-3b930c194c93"}' https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports/9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc/apparatuses/217f0118-8dae-4535-8aeb-e98f84ef4671/personnel

#### Success Response

    HTTP/1.1 200 OK
    {
      "uuid": "af4246e3-1e70-455d-aef4-d69c23c9ca83",
      "full_name": "Gary Oldman",
      "first_name": "Gary",
      "middle_name": "",
      "last_name": "Oldman",
      "apparatus_name": "Ambulance 1",
      "apparatus_use": "2 - EMS"
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc already exists and it is deleted."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report Apparatus for UUID: 217f0118-8dae-4535-8aeb-e98f84ef4671 does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Personnel for UUID: 9824bc40-baa0-4c12-8aa7-3b930c194c93 does not exist."
    }

### DELETE /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:incident_report_apparatus_uuid/personnel/:uuid

Delete Incident Report Personnel item.

    DELETE /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:incident_report_apparatus_uuid/personnel/:uuid

#### Parameters

| Name                           | Type   | Description                                  |
| :----------------------------- | :----- | :------------------------------------------- |
| incident_report_uuid           | string | **Required**. Incident Report UUID           |
| incident_report_apparatus_uuid | string | **Required**. Incident Report Apparatus UUID |
| uuid                           | string | **Required**. Incident Report Personnel UUID |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/incident-reports/9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc/apparatuses/217f0118-8dae-4535-8aeb-e98f84ef4671/personnel/af4246e3-1e70-455d-aef4-d69c23c9ca83

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report for UUID: 9f970231-4ad1-4ab5-9feb-fe1b4dc91ccc already exists and it is deleted."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report Apparatus for UUID: 217f0118-8dae-4535-8aeb-e98f84ef4671 does not exist."
    }

    HTTP/1.1 422 Unprocessable entity
    {
      "code": 0,
      "message": "The Incident Report personnel for UUID: af4246e3-1e70-455d-aef4-d69c23c9ca83 does not exist."
    }

## Change Log:

- added `GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads` method
- added `POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads` method
- added `PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads/:id` method
- added `DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-three-leads/:id` method
- added `GET /fd-api/v1/_health` method
- added `GET /fd-api/v1/_health/deep` method
- added `PUT /fd-api/v1/v1/patientRecords/:recordId` method
- added `GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker` method
- added `POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker` method
- added `PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker/:id` method
- added `DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-treatment-marker/:id` method
- added `GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker` method
- added `POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker` method
- added `PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker/:id` method
- added `DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-medication-marker/:id` method
- added `GET /fd-api/v1/device-locations` method
- added `GET /fd-api/v1/fire-incidents` method
- added `aid_fdid_numbers` param to `POST /fd-api/v1/nfirs-notifications`, `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `GET /fd-api/v1/ems-cases/case-xref-id/:case_xref_id` method
- added `GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs` method
- added `GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots` method
- added `GET /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads` method
- added `aid_type_code`, `aid_fdid_number` params to `POST /fd-api/v1/nfirs-notifications`, `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `GET /fd-api/v1/ems-cases/:id` method
- added `POST /fd-api/v1/ems-cases` method
- added `PUT /fd-api/v1/ems-cases/:id` method
- added `DELETE /fd-api/v1/ems-cases/:id` method
- added `POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs` method
- added `PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs/:id` method
- added `DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-vital-signs/:id` method
- added `POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots` method
- added `PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:id` method
- added `DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:id` method
- added `POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:ems_case_snapshot_id/ems-case-snapshot-images` method
- added `PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:ems_case_snapshot_id/ems-case-snapshot-images/:id` method
- added `DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-snapshots/:ems_case_snapshot_id/ems-case-snapshot-images/:id` method
- added `POST /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads` method
- added ` PUT /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads/:id` method
- added `DELETE /fd-api/v1/ems-cases/:ems_case_id/ems-case-twelve-leads/:id` method
- added `zip_code` values to `GET /fd-api/v1/nfirs-notifications/:id` method
- added `zip_code` params to `POST /fd-api/v1/nfirs-notificatitons` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `GET /fd-api/v1/apparatuses/unit-call-signs` method
- added `patient_arrived_at`, `patient_transferred_at` params to `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses`, `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses`, `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` methods
- added `GET /fd-api/v1/schedule` method
- added `GET /fd-api/v1/logs/settings` method
- added `POST /fd-api/v1/logs` method
- added `POST /fd-api/v1/logs/batch` method
- added `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` method
- added `DELETE /fd-api/v1/nfirs-notification/number/:incident_number` method
- added `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` method
- added `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` method
- added `DELETE /fd-api/v1/nfirs-notification/number/:incident_number/apparatuses/code/:unit_code` method
- added `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel` method
- added `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id` method
- added `DELETE /fd-api/v1/nfirs-notification/number/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id` method
- added `system_id` value to `GET /fd-api/v1/tce-inventories/xref/:inventory_id` method
- added `system_id` param to `POST /fd-api/v1/tce-inventories` method
- added `is_inventory_tracked`, `max_inventory_count`, `is_service_dates_based_on_inventory` values to `GET /fd-api/v1/tce-systems/xref/:system_id` method
- added `is_inventory_tracked`, `max_inventory_count`, `is_service_dates_based_on_inventory` params to `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:system_id` methods
- added `GET /fd-api/v1/nfirs-notifications/:id` method
- added `POST /fd-api/v1/nfirs-notifications` method
- added `PUT /fd-api/v1/nfirs-notifications/:id` method
- added `DELETE /fd-api/v1/nfirs-notification/:id` method
- added `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` method
- added `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` method
- added `DELETE /fd-api/v1/nfirs-notification/:nfirs_notification_id/apparatuses/:id` method
- added `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel` method
- added `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id` method
- added `DELETE /fd-api/v1/nfirs-notification/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id` method
- added `address2` value to `GET /fd-api/v1/dispatches` method
- added `address2` param to `POST /fd-api/v1/dispatches`, `PATCH /fd-api/v1/dispatches/xref/:xref_id` and `PUT /fd-api/v1/dispatches/xref/:xref_id` methods
- added `is_current` value to `GET /fd-api/v1/tce-inventories/xref/:inventory_id` method
- added `is_current` param to `POST /fd-api/v1/tce-inventories` and `PATCH /fd-api/v1/tce-inventories/xref/:inventory_id` methods
- added `is_current` value to `GET /fd-api/v1/tce-systems/xref/:system_id` method
- added `is_current` param to `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:system_id` methods
- added `HEAD /fd-api/v1/iams/email/:email` method
- changed response of `POST /fd-api/v1/preplans/units/caution-notes` method
- added `GET /fd-api/v1/preplans/units/caution-notes`, `DELETE /fd-api/v1/preplans/units/caution-notes` methods
- added `incident_type_code` value to `GET /fd-api/v1/dispatches` method
- added `incident_type_code` param to `POST /fd-api/v1/dispatches`, `PATCH /fd-api/v1/dispatches/xref/:xref_id` and `PUT /fd-api/v1/dispatches/xref/:xref_id` methods
- deleted `latitude` and `longitude` params from `POST /fd-api/v1/preplans/units/caution-notes` method
- added `POST /fd-api/v1/preplans/units/caution-notes` method
- added `tag_color_code` value to `GET /fd-api/v1/tce-premises/xref/:id`, `GET /fd-api/v1/tce-systems/xref/:id` and `GET /fd-api/v1/tce-inventories/xref/:id` methods
- added `tag_color_code` param to `POST /fd-api/v1/tce-premises`, `PATCH /fd-api/v1/tce-premises/xref/:id`, `POST /fd-api/v1/tce-systems`, PATCH `/fd-api/v1/tce-systems/xref/:id`, `POST /fd-api/v1/tce-inventories` and PATCH `/fd-api/v1/tce-inventories/xref/:id` methods
- added `GET /fd-api/v1/tce-premises/xref/:id`, `GET /fd-api/v1/tce-systems/xref/:id` and `GET /fd-api/v1/tce-inventories/xref/:id`methods
- renamed `has_open_dificiencies` to `has_open_deficiencies` in `POST /fd-api/v1/tce-systems`, `PATCH /fd-api/v1/tce-systems/xref/:id`, `POST /fd-api/v1/tce-inventories` and `PATCH /fd-api/v1/tce-inventories/xref/:id` methods
- added `system_type_name`, `last_inspection_date`, `next_inspection_date`, `has_open_dificiencies` and `description` params to `POST /fd-api/v1/tce-inventories` and `PATCH /fd-api/v1/tce-inventories/xref/:id` methods
- deleted `system_profile_current`, `system_profile_compliance` and `tce_system_id` params from `POST /fd-api/v1/tce-inventories` and `PATCH /fd-api/v1/tce-inventories/xref/:id` methods
- added `has_open_dificiencies` and `status_code` params to `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:id` methods
- renamed `last_inspected_date` to `last_inspection_date` in `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:id` methods
- renamed `renewal_date` to `next_inspection_date` in `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:id` methods
- renamed `address` param to `address1` in `POST /fd-api/v1/tce-premises` and `PATCH /fd-api/v1/tce-premises/xref/:id` methods
- deleted `system_profile_current`, `system_profile_compliance` and `status_code` params from `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:id` methods
- added `POST /fd-api/v1/tce-inventories` and `PATCH /fd-api/v1/tce-inventories/xref/:id` methods
- added `PATCH /fd-api/v1/tce-systems/xref/:id` method
- added `POST /fd-api/v1/tce-premises`, `PATCH /fd-api/v1/tce-premises/xref/:id` and `POST /fd-api/v1/tce-systems` methods
- `message` param is not required in `POST /fd-api/v1/dispatches` and `PUT /fd-api/v1/dispatches/xref/:xref_id` methods
- added `PUT /fd-api/v1/dispatches/xref/:xref_id` method
- added `GET /fd-api/v1/dispatches` method
- added `unit_codes` param to `PATCH /fd-api/v1/dispatches/xref/:xref_id` method
- added `PATCH /fd-api/v1/dispatches/xref/:xref_id` method
- added HTTP error code 406 to `POST /dispatches` method
- added `xref_id` param to `POST /dispatches` method
- added `GET /fd-api/v1/aladtec-personnel` method
- added `POST /fd-api/v1/aladtec-personnel` method
- added `PUT /fd-api/v1/aladtec-personnel/:id` method
- added `DELETE /fd-api/v1/aladtec-personnel/:id` method
- added `GET /fd-api/v1/dispatch-units/codes` method
- added `nfirs_incident_number` param to `POST /fd-api/v1/dispatches` and `PATCH /fd-api/v1/dispatches/xref/:xref_id` and `PUT /fd-api/v1/dispatches/xref/:xref_id` methods
- added `officer_in_charge` param to `GET /fd-api/v1/nfirs-notifications/:id` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `call_completed_at` param to `GET /fd-api/v1/nfirs-notifications/:id` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `unit_left_scene_at` param to `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` and `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` methods
- added `arrival_destination_landing_area_at` param to `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` and `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` methods
- added `patient_arrival_destination_at` param to `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` and `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` methods
- added `destination_patient_transfer_care_at` param to `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` and `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` methods
- added `unit_back_home_location_at` param to `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` and `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` methods
- added `unit_arrived_staging_at` param to `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` and `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` methods
- added `place_name` and `radio_channel` params to `GET /fd-api/v1/dispatches` and `POST /fd-api/v1/dispatches`, `PATCH /fd-api/v1/dispatches/xref/:xref_id` and `PUT /fd-api/v1/dispatches/xref/:xref_id` methods
- added `zone` param to `GET /fd-api/v1/nfirs-notifications/:id` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `house_num` param to `GET /fd-api/v1/nfirs-notifications/:id` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `prefix_direction` param to `GET /fd-api/v1/nfirs-notifications/:id` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `street_name` param to `GET /fd-api/v1/nfirs-notifications/:id` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `street_type` param to `GET /fd-api/v1/nfirs-notifications/:id` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `suffix_direction` param to `GET /fd-api/v1/nfirs-notifications/:id` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `beginning_odo` param to `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` and `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` methods
- added `on_scene_odo` param to `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` and `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` methods
- added `patient_dest_odo` param to `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` and `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` methods
- added `ending_odo` param to `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` and `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` and `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` methods
- added `ems_incident_number` param to `GET /fd-api/v1/nfirs-notifications/:id` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods
- added `ems_response_number` param to `GET /fd-api/v1/nfirs-notifications/:id` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` methods

- added `GET /fd-api/v1/paymentus/invoice` method
- added `POST /fd-api/v1/paymentus/confirm-payment` method
- added `GET /fd-api/v1/apparatuses/vehicle-number/:vehicle_number` method
- added `GET /fd-api/v1/apparatuses/api-apparatus-id/:api_apparatus_id` method
- added `GET /fd-api/v1/asset-work-order-board` method
- added `GET /fd-api/v1/asset-work-orders` method
- added `GET /fd-api/v1/asset-work-orders/:id` method
- added `PATCH /fd-api/v1/apparatuses/:id`
- added `GET /fd-api/v1/occupancies` method
- added `GET /fd-api/v1/get-units-by-dispatches` method
- added `alarm_level` param to `GET /fd-api/v1/dispatches`, `POST /fd-api/v1/dispatches`, `PATCH /fd-api/v1/dispatches/xref/:xref_id` and `PUT /fd-api/v1/dispatches/xref/:xref_id` methods
- Added `responder_status`, `responder_status_code`, `responding_address`, `responding_dispatch_place_location`, `fire_station_id`, `fire_station_name_or_number` to `GET /fd-api/v1/device-locations` method response
- added `GET /fd-api/v1/nfirs-notifications/number/:incident_number` method
- added `GET /fd-api/v1/nfirs-notifications/dispatch_number/:dispatch_number` method
- added `GET /fd-api/v1/get-hydrants` method
- added `GET /fd-api/v1/get-hydrant-services` method
- added `GET /fd-api/v1/fdids` method
- added `GET /fd-api/v1/stations` method
- added `GET /fd-api/v1/shifts` method
- added `GET /fd-api/v1/response-zones` method
- added `GET /fd-api/v1/aid-departments` method
- added `GET /fd-api/v1/apparatuses` method
- added `GET /fd-api/v1/personnel` method
- added `GET /fd-api/v1/incident-reports/:incident_report_uuid` method
- added `POST /fd-api/v1/incident-reports` method
- added `PUT /fd-api/v1/incident-reports/:incident_report_uuid` method
- added `DELETE /fd-api/v1/incident-reports/:incident_report_uuid` method
- added `PATCH /fd-api/v1/incident-reports/:incident_report_uuid/authorize` method
- added `GET /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses` method
- added `GET /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:uuid` method
- added `POST /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses` method
- added `PUT /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:uuid` method
- added `DELETE /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:uuid` method
- added `GET /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:apparatus_uuid/personnel/:uuid` method
- added `POST /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:apparatus_uuid/personnel` method
- added `DELETE /fd-api/v1/incident-reports/:incident_report_uuid/apparatuses/:apparatus_uuid/personnel/:uuid` method
- added `cross_streets` param to `GET /fd-api/v1/dispatches`, `POST /fd-api/v1/dispatches`, `PATCH /fd-api/v1/dispatches/xref/:xref_id` and `PUT /fd-api/v1/dispatches/xref/:xref_id` methods
- added `station` param to `GET /fd-api/v1/nfirs-notifications/:id` and `GET /fd-api/v1/nfirs-notifications/:incident_number` and `GET /fd-api/v1/nfirs-notifications/:dispatch_number` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` and `PUT /fd-api/v1/nfirs-notifications/number/:dispatch_number` methods
- added `emd_card_number` param to `GET /fd-api/v1/nfirs-notifications/:id` and `GET /fd-api/v1/nfirs-notifications/:incident_number` and `GET /fd-api/v1/nfirs-notifications/:dispatch_number` and `POST /fd-api/v1/nfirs-notifications` and `PUT /fd-api/v1/nfirs-notifications/:id` and `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` and `PUT /fd-api/v1/nfirs-notifications/number/:dispatch_number` methods

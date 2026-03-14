## Access

### GET /api/v2/access/{conference}

Checks whether the user is a participant in the conference and whether the token is valid.

- **Path params:** `conference` _(string, required)_
- **200:** Access token is valid, user is conference participant
- **401:** Access token is not valid or expired
- **403:** User is not conference participant or conference does not exist

## Accounts Groups

### GET /api/v2/accounts/groups

List account groups with filtration.

- **Query params:** `search` _(string, optional)_, `ldap` _(boolean, optional)_, `limit` _(integer, optional)_, `offset` _(integer, optional)_, `sort` _(string, optional)_, `direction` _(string, optional)_
- **200:** Returns a list of account groups

### POST /api/v2/accounts/groups

Create account group.

- **Body:** `name` _(string, required)_
- **200:** Returns created account group

### GET /api/v2/accounts/groups/{accountGroup}

Get account group settings.

- **Path params:** `accountGroup` _(integer, required)_ — Account group ID
- **200:** Returns account group details

### DELETE /api/v2/accounts/groups/{accountGroup}

Delete account group.

- Available only for manually created groups
- **Path params:** `accountGroup` _(integer, required)_ — Account group ID
- **200:** Ok

### PATCH /api/v2/accounts/groups/{accountGroup}

Update account group.

- Available only for manually created groups
- **Path params:** `accountGroup` _(integer, required)_ — Account group ID
- **Body:** `id` _(integer, optional)_, `name` _(string, optional)_, `ldap` _(boolean, optional)_
- **200:** Ok

### POST /api/v2/accounts/groups/{accountGroup}/addAccounts

Add accounts to the group.

- Available only for manually created groups
- **Path params:** `accountGroup` _(integer, required)_ — Account group ID
- **Body:** Schema not clearly defined in provided spec
- **200:** Ok

### POST /api/v2/accounts/groups/{accountGroup}/removeAccounts

Remove accounts from the group.

- Available only for manually created groups
- **Path params:** `accountGroup` _(integer, required)_ — Account group ID
- **Body:** Schema not clearly defined in provided spec
- **200:** Ok

## Accounts

### GET /api/v1/accounts

Abonents list. Only for Admins. Total count is returned via `X-Total-Count` header.

- **Query params:** `offset` _(number, optional)_, `limit` _(number, optional)_, `search` _(string, optional)_, `email` _(string, optional)_, `sort` _(string, optional)_, `direction` _(string, optional)_, `filterBy` _(string, optional, deprecated)_, `filterWith` _(string, optional, deprecated)_, `type` _(string, optional)_, `group` _(string, optional)_, `source` _(string, optional)_, `tenant` _(string, optional)_, `category` _(integer, optional)_, `exceptions` _(array[string], optional)_
- **200:** Ok
- **403:** Access denied

### POST /api/v1/accounts

Create an abonent. Only for Admins.

- **Body:** `number` _(string, required)_, `type` _(string, required)_, `conferences` _(array, optional)_, `password` _(string, required)_, `description` _(string, optional)_, `inVolume` _(number, optional)_, `outVolume` _(number, optional)_, `VoIPSecret` _(string, optional)_, `email` _(string, optional)_, `group` _(string|null, optional)_, `bandwidth` _(number, optional)_, `resolutionP2P` _(string, optional)_, `ip` _(string, optional)_, `mediaStreams` _(boolean, optional)_, `behindNat` _(string, optional)_, `h264HighProfile` _(boolean, optional)_, `qualify` _(boolean, optional)_, `mediaEncryption` _(boolean, optional)_, `skype4b` _(boolean, optional)_, `h4601` _(boolean, optional)_, `h239` _(boolean, optional)_, `h224` _(boolean, optional)_, `port` _(number, optional)_, `insecure` _(string, optional)_, `bfcpType` _(string, optional)_, `transport` _(string, optional)_, `dtmf` _(string, optional)_, `serveGateway` _(string, optional)_, `crypto` _(boolean, optional)_, `defaultResolution` _(string, optional)_, `ignore` _(boolean, optional)_, `allowGroupCall` _(boolean, optional)_, `interpreter` _(boolean, optional)_, `protectRTP` _(boolean, optional)_, `panasonicFEC` _(boolean, optional)_, `codecs` _(array[string], optional)_
- **200:** Ok
- **403:** Access denied
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/account/{account}

Get abonent params and settings. Only for Admins.

- **Path params:** `account` _(string, required)_ — Account number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### DELETE /api/v1/account/{account}

Delete abonent. Only for Admins.

- **Path params:** `account` _(string, required)_ — Account number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **500:** Internal server error

### PATCH /api/v1/account/{account}

Change abonent params and settings. Only for Admins.

- **Path params:** `account` _(string, required)_ — Account number
- **Body:** `description` _(string, optional)_, `password` _(string, optional)_, `passwordChangeRequired` _(boolean, optional)_, `VoIPSecret` _(string, optional)_, `email` _(string, optional)_, `group` _(string|null, optional)_, `bandwidth` _(number, optional)_, `resolutionP2P` _(string, optional)_, `ip` _(string, optional)_, `mediaStreams` _(boolean, optional)_, `behindNat` _(string, optional)_, `h264HighProfile` _(boolean, optional)_, `qualify` _(boolean, optional)_, `mediaEncryption` _(boolean, optional)_, `skype4b` _(boolean, optional)_, `h4601` _(boolean, optional)_, `h239` _(boolean, optional)_, `h224` _(boolean, optional)_, `port` _(number, optional)_, `insecure` _(string, optional)_, `bfcpType` _(string, optional)_, `transport` _(string, optional)_, `dtmf` _(string, optional)_, `serveGateway` _(string, optional)_, `crypto` _(boolean, optional)_, `defaultResolution` _(string, optional)_, `ignore` _(boolean, optional)_, `allowGroupCall` _(boolean, optional)_, `interpreter` _(boolean, optional)_, `protectRTP` _(boolean, optional)_, `panasonicFEC` _(boolean, optional)_, `codecs` _(array[string], optional)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/delete_accounts

Delete accounts. Only for Admins.

- **Body:** `numbers` _(array[string], required)_
- **200:** Ok
- **403:** Access denied
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/allowed_accounts/{conference}

List accounts allowed to be added to a conference. Only for Conference Moderators.

- **Path params:** `conference` _(string, required)_ — Conference number
- **Query params:** `offset` _(number, optional)_, `limit` _(number, optional)_, `search` _(string, optional)_, `email` _(string, optional)_, `sort` _(string, optional)_, `direction` _(string, optional)_, `filterBy` _(string, optional, deprecated)_, `filterWith` _(string, optional, deprecated)_, `type` _(string, optional)_, `group` _(string, optional)_, `source` _(string, optional)_, `tenant` _(string, optional)_, `category` _(integer, optional)_, `exceptions` _(array[string], optional)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### GET /api/v1/allowed_moderators/{conference}

List accounts allowed to be added as moderators to a conference. Only for Conference Moderators.

- **Path params:** `conference` _(string, required)_ — Conference number
- **Query params:** `offset` _(number, optional)_, `limit` _(number, optional)_, `search` _(string, optional)_, `email` _(string, optional)_, `sort` _(string, optional)_, `direction` _(string, optional)_, `filterBy` _(string, optional, deprecated)_, `filterWith` _(string, optional, deprecated)_, `type` _(string, optional)_, `group` _(string, optional)_, `source` _(string, optional)_, `tenant` _(string, optional)_, `category` _(integer, optional)_, `exceptions` _(array[string], optional)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### POST /api/v2/accounts/{account}/avatar/upload

Update the account avatar.

- **Path params:** `account` _(string, required)_ — Account number
- **Body:** `file` _(multipart/form-data, required)_ — Avatar file, supported format: `jpeg`, maximum size: `10MB`
- **200:** Ok

## AddressBook

### GET /api/v2/addressBook/compiled/account/{account}

Get the address book filtered by the account's vision profile. Available for self or admin.

- **Path params:** `account` _(string, required)_ — Account number
- **Query params:** `substituteProfile` _(string, optional)_
- **200:** Ok

### GET /api/v2/addressBook/groups

Get groups list.

- **Query params:** `source` _(string, required)_, `search` _(string, required)_, `limit` _(integer, required)_, `offset` _(integer, required)_, `tenant` _(string, optional)_
- **200:** Ok

### POST /api/v2/addressBook/groups

Create group.

- **Body:** `identity` _(string, optional)_, `name` _(string, required)_, `weight` _(number, optional)_, `tenant` _(string, optional)_
- **200:** Ok

### GET /api/v2/addressBook/contacts

Get contacts list.

- **Query params:** `limit` _(integer, optional)_, `offset` _(integer, required)_, `search` _(string, required)_, `group` _(string, required)_, `withoutGroup` _(boolean, required)_, `isAccount` _(boolean, optional)_, `source` _(string, required)_
- **200:** Ok

### POST /api/v2/addressBook/contacts

Create alias contact.

- **Body:** `identity` _(string, optional)_, `address` _(string, required)_, `weight` _(number, optional)_, `name` _(string, required)_, `email` _(string, optional)_, `arbitraryData` _(string, optional)_, `groups` _(array[string], optional)_
- **200:** Ok

### POST /api/v2/addressBook/batch/contacts/delete

Delete multiple contacts.

- **Body:** `contacts` _(array[string], required)_
- **204:** No content

### POST /api/v2/addressBook/batch/contacts/patch

Update multiple contacts.

- **Body:** `contacts` _(array[string], required)_, `weight` _(number, optional)_, `accessProfile` _(string, optional)_
- **204:** No content

### GET /api/v2/addressBook/groups/{group}

Get group data.

- **Path params:** `group` _(string, required)_
- **200:** Ok

### DELETE /api/v2/addressBook/groups/{group}

Delete group.

- **Path params:** `group` _(string, required)_
- **204:** No content

### PATCH /api/v2/addressBook/groups/{group}

Update group.

- **Path params:** `group` _(string, required)_
- **Body:** `identity` _(string, optional)_, `name` _(string, optional)_, `publish` _(boolean, optional)_, `source` _(string, optional)_, `weight` _(number, optional)_, `accessProfile` _(string, optional)_, `tenant` _(string, optional)_
- **204:** No content

### GET /api/v2/addressBook/contacts/{contact}

Get contact data.

- **Path params:** `contact` _(string, required, uuid)_
- **200:** Ok

### DELETE /api/v2/addressBook/contacts/{contact}

Delete contact.

- **Path params:** `contact` _(string, required, uuid)_
- **204:** No content

### PATCH /api/v2/addressBook/contacts/{contact}

Update contact. Request type depends on contact type.

- **Path params:** `contact` _(string, required, uuid)_
- **Body:** `name` _(string, optional)_, `tenant` _(string, optional)_, `address` _(string, optional)_, `weight` _(number, optional)_, `email` _(string, optional)_, `arbitraryData` _(string, optional)_, `addGroups` _(array[string], optional)_, `removeGroups` _(array[string], optional)_
- **204:** No content

### PATCH /api/v2/addressBook/hierarchy

Update hierarchy.

- **Body:** `remove` _(array, optional)_, `add` _(array, optional)_ — items contain `group` _(string)_ and `contact` _(string)_
- **204:** No content

### POST /api/v2/addressBook/attachable

Add multiple accounts.

- **Body:** `accounts` _(array[string], required)_, `weights` _(number, optional)_, `accountGroups` _(array[integer], optional)_, `addToGroups` _(array[string], optional)_
- **200:** Ok

### GET /api/v2/addressBook

Get address book content. Address book is filtered and sorted.

- **Query params:** `source` _(string, required)_, `search` _(string, required)_, `vision` _(string, required)_, `profile` _(string, required)_, `shallow` _(boolean, optional, deprecated)_, `open` _(array[string], required)_
- **200:** Ok

### GET /api/v2/addressBook/attachable/accounts

Get accounts available for attach.

- **Query params:** `limit` _(integer, required)_, `offset` _(integer, required)_, `search` _(string, required)_, `group` _(string, required)_, `withoutGroup` _(boolean, required)_, `intersect` _(array[string], optional)_
- **200:** Ok

### GET /api/v2/addressBook/sources

Get server sources.

- **200:** Ok

## AddressBookProfiles

### GET /api/v2/addressBook/profiles

Get shallow index of available book access profiles.

- At least the default profile is always returned
- **200:** Ok

### GET /api/v2/addressBook/profiles/{profile}

Load complete book access profile aggregate with vision settings.

- Default access profile always counts as not assigned to anything due to special rules
- **Path params:** `profile` _(required)_ — Custom profile UUID or default profile id `*`
- **200:** Ok

### PUT /api/v2/addressBook/profiles/{profile}

Overwrite book access profile.

- Default profile name remains unchanged
- Default profile is not explicitly assigned to accounts or groups
- **Path params:** `profile` _(string, required)_
- **Body:** `uuid` _(string, optional)_, `name` _(string, optional)_, `baseProfile` _(string, optional)_, `tenant` _(string, optional)_, `profile` _(object, required)_
- **204:** No content

### DELETE /api/v2/addressBook/profiles/{profile}

Delete book access profile.

- Default profile will be purged, not completely deleted
- **Path params:** `profile` _(required)_ — Custom profile UUID or default profile id `*`
- **204:** No content

## ApiKeys

### GET /api/v2/apiKeys

List all API keys.

- **200:** Ok

### POST /api/v2/apiKeys

Create API key.

- **Body:** `title` _(string, required)_, `security.ipWhitelist` _(array[string], optional)_
- **200:** Ok

### GET /api/v2/apiKeys/{apiKey}

Get API key data.

- **Path params:** `apiKey` _(string, required)_
- **200:** Ok

### DELETE /api/v2/apiKeys/{apiKey}

Delete API key.

- **Path params:** `apiKey` _(string, required)_
- **200:** Ok

### PATCH /api/v2/apiKeys/{apiKey}

Update API key.

- **Path params:** `apiKey` _(string, required)_
- **Body:** `title` _(string, optional)_, `security.ipWhitelist` _(array[string], optional)_
- **200:** Ok

## Audio

### GET /api/v2/conference/{conference}/audioChannels

Get conference audio channel settings.

- Available for authenticated and anonymous users
- Anonymous users only get public channels
- Default channel settings are returned if the conference does not exist
- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok
- **400:** Default error
- **500:** Default error

### PATCH /api/v2/conference/{conference}/audioChannels

Update conference audio channels.

- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** `public` _(array, optional)_, `private` _(array, optional)_ — channel items include `number`, `title`, `tag`, `enabled`, `default`, `floor`
- **200:** Ok
- **400:** Default error
- **500:** Default error

### GET /api/v2/conference/{conference}/participant/{participant}/audioChannels

Get participant audio channel settings.

- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_
- **200:** Ok
- **400:** Default error
- **500:** Default error

### PATCH /api/v2/conference/{conference}/participant/{participant}/audioChannels

Update participant audio channels.

- Missing values will be set to default
- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_
- **Body:** `in` _(string, optional)_, `out` _(string, optional)_, `interpreterChannel` _(number, optional)_
- **200:** Ok
- **400:** Default error
- **500:** Default error

## AudioTags

### GET /api/v2/system/settings/audioTags

Get audio tags settings.

- **200:** Ok

### PUT /api/v2/system/settings/audioTags

Save audio tags settings.

- **Body:** `prefix` _(string, required)_
- **200:** Ok

## Authentication

### POST /api/v1/auth/jwt

Authorize and get access and refresh tokens.

- Allowed for all
- **Body:** `username` _(string, required)_, `password` _(string, required)_
- **201:** Created
- **403:** Invalid username or password
- **422:** Invalid JSON or request data

### GET /api/v1/auth/refresh

Refresh access and refresh tokens.

- Refresh token must be set in the `Authorization` header
- **200:** Ok
- **401:** Unauthorized

### GET /api/v2/auth/self

Get authenticated user info.

- **200:** Ok

## CDR

### GET /api/v2/cdr/records

Get CDR records by period with search.

- **Query params:** `from` _(object, required)_ — Start date in `YYYY-MM-DD` format, `to` _(object, required)_ — End date in `YYYY-MM-DD` format, `search` _(string, required)_, `limit` _(integer, optional)_, `offset` _(integer, optional)_
- **200:** Ok

### GET /api/v2/cdr/bye-packets/{id}

Get a BYE packet.

- **Path params:** `id` _(string, required)_
- **200:** Ok

### GET /api/v2/cdr/reports/{report}

Get report data.

- Returns report file data
- **Path params:** `report` _(integer, required)_ — CDR report ID
- **200:** Ok

### DELETE /api/v2/cdr/reports/{report}

Delete a report.

- Deletes report data and file
- **Path params:** `report` _(integer, required)_ — CDR report ID
- **200:** Ok

### GET /api/v2/cdr/reports

Get reports page by page.

- **Query params:** `limit` _(integer, optional)_, `offset` _(integer, optional)_
- **200:** Ok

### POST /api/v2/cdr/reports

Add a task to create a report.

- **Body:** `from` _(number, required)_, `to` _(number, required)_, `search` _(string, optional)_, `filename` _(string, required)_, `filetype` _(string, required)_
- **200:** Ok

### GET /api/v2/cdr/reports/{report}/file

Get the report file.

- **Path params:** `report` _(integer, required)_ — CDR report ID
- **200:** Ok

### GET /api/v2/system/settings/cdr

Get CDR settings.

- **200:** Ok

### PUT /api/v2/system/settings/cdr

Save CDR settings.

- **Body:** `main.enabled` _(boolean, required)_, `main.storePeriod` _(number, required)_, `main.deleteOldIfQuotaExeeded` _(boolean, required)_, `main.storeFailedCalls` _(boolean, required)_, `reports.enabled` _(boolean, required)_, `reports.fileType` _(string, required)_, `reports.storePeriod` _(number, required)_, `reports.storageQuota` _(number, required)_
- **200:** Ok

## Chat

### POST /api/v1/messages

Send message.

- Message cannot be sent if the user has not set a displayed name
- **Body:** `conference` _(string, required)_, `message` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### DELETE /api/v1/messages/{conference}/{messageId}

Delete chat message.

- Use message ID and conference number for deleting
- **Path params:** `conference` _(string, required)_ — Conference number, `messageId` _(string, required)_
- **204:** No content
- **403:** Access denied
- **404:** Conference not found

### GET /api/v1/messages/display_name

Get current displayed name.

- Name displayed in chat
- **200:** Ok
- **403:** Access denied

### POST /api/v1/messages/display_name

Change current displayed name.

- Name that will be displayed in chat
- **Body:** `value` _(string, required)_
- **201:** Created
- **403:** Access denied
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/messages/{conference}

Get conference chat messages.

- To get only new messages, use query param `last` with the last received message ID
- Additional headers: `X-Vinteo-Last-ID`, `X-Vinteo-Total`, `X-Vinteo-Online`, `X-Vinteo-Ban`
- **Path params:** `conference` _(string, required)_ — Conference number
- **Query params:** `last` _(number, optional)_ — Last message ID
- **200:** Ok
- **403:** Chat is off or access denied
- **404:** Entity not found

### GET /api/v1/messages/stats/{conference}

Get chat users statistics.

- Only for conference moderators
- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

## ConferenceSettings

### GET /api/v2/default_settings/conferences

Get default conference settings.

- **200:** Ok

### POST /api/v2/default_settings/conferences

Set default conference settings.

- **Body:** Conference default settings object
- **200:** Ok

### POST /api/v2/default_settings/conferences/background

Upload background image.

- **Body:** `file` _(multipart/form-data, required)_ — Background image, supported formats: `jpg`, `png`, maximum size: `5MB`
- **201:** Created

## Conferences

### GET /api/v1/conferences

Get conferences list with short data.

- **Query params:** `limit` _(number, optional)_, `offset` _(number, optional)_, `filter` _(string, optional)_, `filterInternal` _(integer, optional)_, `sort` _(string, optional)_, `direction` _(string, optional)_, `search` _(string, optional)_
- **200:** Ok

### POST /api/v1/conferences

Create conference.

- Only for conference admins and higher
- **Body:** Conference create payload
- **201:** Created
- **403:** Access denied
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/conferences/add

Create conference.

- Only for conference admins and higher
- **Body:** Conference create payload
- **201:** Created
- **403:** Access denied
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/conference/{conference}

Get conference params and settings.

- Only for moderators and admins
- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### DELETE /api/v1/conference/{conference}

Delete conference.

- Only for conference admins
- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **500:** Internal server error

### PATCH /api/v1/conference/{conference}

Change conference params and settings.

- Only for moderators and admins
- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** Conference update payload
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/message

Send message to conference.

- Only for moderators
- **Body:** `conference` _(number, required)_, `message` _(string, required)_, `participants` _(array[string], optional)_, `color` _(string, optional)_, `background` _(string, optional)_, `opacity` _(number, optional)_, `size` _(number, optional)_, `speed` _(number, optional)_, `position` _(number, optional)_, `repeat` _(number, optional)_, `clear` _(boolean, optional)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/start_conference

Start conference.

- Only for moderators
- **Body:** `conference` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/stop_conference

Stop conference.

- Only for moderators
- **Body:** `conference` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

## Conferencing

### GET /api/v2/conferences/{conference}/features

Get additional conference functionality list.

- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok

### POST /api/v2/conferences/{conference}/connections/{participant}

Confirm the connection to the conference from purgatory.

- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_
- **204:** No content

### DELETE /api/v2/conferences/{conference}/connections/{participant}

Reject the connection to the conference from purgatory.

- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_
- **204:** No content

### DELETE /api/v2/conferences/{conference}/connections/{participant}/presentation

Stop presentation for participant.

- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_
- **204:** No content

### GET /api/v2/conferences/pin

Generate random PIN for a conference.

- **200:** Ok

### POST /api/v2/conferences/{conference}/settings/background/upload

Upload conference background image.

- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** `file` _(multipart/form-data, required)_ — Background image, supported formats: `jpg`, `png`, maximum size: `5MB`
- **204:** No content

### POST /api/v2/conferences/{conference}/participants/{participant}/audio-messages

Send audio messages.

- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_
- **Body:** `filename` _(string, required)_
- **204:** No content

### POST /api/v2/conferences/{conference}/participants/{participant}/status-bar

Set status bar.

- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_
- **Body:** `value` _(string, required)_
- **200:** Ok

### DELETE /api/v2/conferences/{conference}/moderator/{accountNumber}

Remove a moderator from a conference.

- **Path params:** `conference` _(string, required)_ — Conference number, `accountNumber` _(string, required)_
- **200:** Ok

### POST /api/v2/conferences/{conference}/moderator

Add a moderator to the conference.

- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** `accountNumber` _(string, required)_
- **200:** Ok

### GET /api/v2/conferences/{conference}/participations

Get own participation request data.

- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok

### POST /api/v2/conferences/{conference}/participations

Create own participation request.

- Conference participant has only one request; if it already exists, it is overwritten
- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok

### DELETE /api/v2/conferences/{conference}/participations

Cancel own participation request.

- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok

### PUT /api/v2/conferences/{conference}/participations/{participant}

Approve participation request.

- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_
- **200:** Ok

### DELETE /api/v2/conferences/{conference}/participations/{participant}

Refuse participation request.

- For conference moderators only
- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_
- **200:** Ok

### POST /api/v2/conferences/{conference}/stream-players

Add stream player.

- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** `uri` _(string, required)_, `title` _(string, required)_, `ignore` _(boolean, optional)_
- **201:** Created

### PUT /api/v2/conferences/{conference}/stream-players/{player}

Update stream player.

- **Path params:** `conference` _(string, required)_ — Conference number, `player` _(string, required)_
- **Body:** `uri` _(string, required)_, `title` _(string, required)_, `ignore` _(boolean, optional)_
- **200:** Ok

## Gateways

### GET /api/v1/gateways

Get gateways list.

- Only for admins
- **Query params:** `limit` _(number, optional)_, `offset` _(number, optional)_, `sort` _(string, optional)_, `direction` _(string, optional)_, `search` _(string, optional)_
- **200:** Ok
- **403:** Access denied

### POST /api/v1/gateways

Add gateway.

- Only for admins
- **Body:** `number` _(string, required)_, `type` _(string, required)_, `ip` _(string, required)_, `acceptIncoming` _(boolean, optional)_, `incomingNumberConversion` _(string, optional)_, `needRegistration` _(boolean, optional)_, `registrationUsername` _(string, optional)_, `registrationPassword` _(string, optional)_, `mediaStreams` _(boolean, optional)_, `behindNat` _(string, optional)_, `h264HighProfile` _(boolean, optional)_, `qualify` _(boolean, optional)_, `mediaEncryption` _(boolean, optional)_, `skype4b` _(boolean, optional)_, `port` _(number, optional)_, `insecure` _(string, optional)_, `bfcpType` _(string, optional)_, `transport` _(string, optional)_, `dtmf` _(string, optional)_, `routes` _(array, optional)_, `domain` _(string, optional)_, `panasonicFEC` _(boolean, optional)_, `crypto` _(boolean, optional)_, `h239` _(boolean, optional)_, `h224` _(boolean, optional)_, `protectRTP` _(boolean, optional)_, `allowAnonymousCalls` _(boolean, optional)_, `codecs` _(array[string], optional)_
- **201:** Created
- **403:** Access denied
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/gateway/{gateway}

Get gateway params and settings.

- Only for admins
- **Path params:** `gateway` _(string, required)_ — Gateway number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### DELETE /api/v1/gateway/{gateway}

Delete gateway.

- Only for admins
- **Path params:** `gateway` _(string, required)_ — Gateway number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **500:** Internal server error

### PATCH /api/v1/gateway/{gateway}

Change gateway.

- Only for admins
- **Path params:** `gateway` _(string, required)_ — Gateway number
- **Body:** `ip` _(string, optional)_, `acceptIncoming` _(boolean, optional)_, `incomingNumberConversion` _(string, optional)_, `needRegistration` _(boolean, optional)_, `registrationUsername` _(string, optional)_, `registrationPassword` _(string, optional)_, `mediaStreams` _(boolean, optional)_, `behindNat` _(string, optional)_, `h264HighProfile` _(boolean, optional)_, `qualify` _(boolean, optional)_, `mediaEncryption` _(boolean, optional)_, `skype4b` _(boolean, optional)_, `port` _(number, optional)_, `insecure` _(string, optional)_, `bfcpType` _(string, optional)_, `transport` _(string, optional)_, `dtmf` _(string, optional)_, `routes` _(array, optional)_, `domain` _(string, optional)_, `panasonicFEC` _(boolean, optional)_, `crypto` _(boolean, optional)_, `h239` _(boolean, optional)_, `h224` _(boolean, optional)_, `protectRTP` _(boolean, optional)_, `allowAnonymousCalls` _(boolean, optional)_, `codecs` _(array, optional)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

## GraphicLayer

### POST /api/v2/conferences/{conference}/slides/{slide}/layers

Add a new layer to a slide.

- **Path params:** `conference` _(string, required)_ — Conference number, `slide` _(integer, required)_ — Slide ID
- **Body:** `title` _(string, required)_
- **201:** Created
- **404:** Error
- **406:** Only one layer allowed

### GET /api/v2/conferences/{conference}/slides/{slide}/layers/{layer}

Get slide layer data.

- **Path params:** `conference` _(string, required)_ — Conference number, `slide` _(integer, required)_ — Slide ID, `layer` _(integer, required)_ — Layer ID
- **200:** Ok
- **404:** Error

### DELETE /api/v2/conferences/{conference}/slides/{slide}/layers/{layer}

Delete a layer from a slide.

- **Path params:** `conference` _(string, required)_ — Conference number, `slide` _(integer, required)_ — Slide ID, `layer` _(integer, required)_ — Layer ID
- **204:** No content
- **404:** Error
- **406:** Slide is showing

### GET /api/v2/conferences/{conference}/slides/{slide}/layers/{layer}/image

Get slide layer image.

- **Path params:** `conference` _(string, required)_ — Conference number, `slide` _(integer, required)_ — Slide ID, `layer` _(integer, required)_ — Layer ID
- **Query params:** `preview` _(string, required)_ — Image resolution width
- **200:** Ok
- **404:** Error

### POST /api/v2/conferences/{conference}/slides/{slide}/layers/{layer}/image

Add an image to a layer.

- File must be uploaded with `image` key in `form-data`
- **Path params:** `conference` _(string, required)_ — Conference number, `slide` _(integer, required)_ — Slide ID, `layer` _(integer, required)_ — Layer ID
- **201:** Created
- **400:** Bad request
- **404:** Error
- **406:** Wrong file

### GET /api/v2/conferences/{conference}/slides/show

Get current slide showing status in conference.

- **Path params:** `conference` _(string, required)_ — Conference number
- **204:** No content

### POST /api/v2/conferences/{conference}/slides/show

Show slide.

- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** `slide` _(integer, required)_
- **204:** No content
- **400:** Bad request

### POST /api/v2/conferences/{conference}/slides/hide

Stop showing the slide.

- **Path params:** `conference` _(string, required)_ — Conference number
- **204:** No content
- **400:** Bad request

### GET /api/v2/conferences/{conference}/slides

Get conference slides.

- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok

### POST /api/v2/conferences/{conference}/slides

Create slide.

- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** `title` _(string, required)_, `opacity` _(number, required)_
- **200:** Ok

### GET /api/v2/conferences/{conference}/slides/{slide}

Get slide data with layers.

- **Path params:** `conference` _(string, required)_ — Conference number, `slide` _(integer, required)_ — Slide ID
- **200:** Ok
- **404:** Error

### PUT /api/v2/conferences/{conference}/slides/{slide}

Edit slide.

- **Path params:** `conference` _(string, required)_ — Conference number, `slide` _(integer, required)_ — Slide ID
- **Body:** `title` _(string, required)_, `opacity` _(number, required)_
- **200:** Ok
- **404:** Error

### DELETE /api/v2/conferences/{conference}/slides/{slide}

Delete slide.

- **Path params:** `conference` _(string, required)_ — Conference number, `slide` _(integer, required)_ — Slide ID
- **200:** Ok
- **404:** Error
- **406:** Slide is showing

### GET /api/v2/conferences/{conference}/slides/{slide}/image

Get slide image.

- **Path params:** `conference` _(string, required)_ — Conference number, `slide` _(integer, required)_ — Slide ID
- **Query params:** `preview` _(string, required)_ — Image resolution width
- **200:** Ok
- **404:** Error

## Integrations

### GET /api/v2/integrations/express/settings

Get Express integration settings.

- **200:** Ok

### PUT /api/v2/integrations/express/settings

Update Express integration settings.

- **Body:** `enabled` _(boolean, required)_, `url` _(string, required)_, `key` _(string, optional)_, `codec` _(string, required)_, `localIp` _(string, required)_, `serverId` _(string, required)_, `displayOverallMosaic` _(boolean, required)_
- **200:** Ok

## Layout

### GET /api/v1/layout/{conference}/{participant}

Get participant personal layout settings.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_ — Participant number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### POST /api/v1/layout/{conference}/{participant}

Create participant personal layout settings.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_ — Participant number
- **Body:** `mosaic` _(string, required)_, `preset` _(number, optional)_, `positions` _(array[string], optional)_, `resolution` _(string, optional)_, `dontShowYourself` _(boolean, optional)_, `positionsCanBecomeLecturer` _(array[number], optional)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/layout/{conference}

Get conference layout settings.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### POST /api/v1/layout/{conference}

Change conference layout.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** `mosaic` _(string, required)_, `preset` _(number, optional)_, `positions` _(array[string], optional)_, `positionsCanBecomeLecturer` _(array[number], optional)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

## Lecturer

### POST /api/v1/appoint_lecturer

Set participant as lecturer.

- Only for moderators
- **Body:** `conference` _(number, required)_, `participant` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/disable_lecturer_mode

Disable lecturer mode.

- Only for moderators
- **Body:** `conference` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/disappoint_lecturer

Unset participant as lecturer.

- Only for moderators
- **Body:** `conference` _(number, required)_, `participant` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/enable_lecturer_mode

Enable lecturer mode.

- Only for moderators
- **Body:** `conference` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

## Licensing

### GET /api/v2/system/licenses

Get the list of used licenses.

- **200:** Ok

## Mail

### GET /api/v2/system/mail/settings

Get email configuration.

- **200:** Ok

### PATCH /api/v2/system/mail/settings

Update email configuration.

- Email notifications are disabled if SMTP settings change until they are tested
- **Body:** `enabled` _(boolean, optional)_, `smtpHost` _(string, optional)_, `smtpPort` _(number, optional)_, `smtpSecure` _(string, optional)_, `smtpAuth` _(string, optional)_, `smtpAuthUsername` _(string, optional)_, `smtpAuthPassword` _(string, optional)_, `name` _(string, optional)_, `from` _(string, optional)_, `server` _(string, optional)_, `recipientLimit` _(number, optional)_
- **200:** Ok

### POST /api/v2/system/mail/test

Test email configuration.

- **Body:** `email` _(string, required)_
- **200:** Ok

### GET /api/v2/system/mail/templates

List all email templates.

- **200:** Ok

### GET /api/v2/system/mail/template/{template}

Get email template.

- **Path params:** `template` _(string, required)_
- **200:** Ok

### PATCH /api/v2/system/mail/template/{template}

Update email template.

- **Path params:** `template` _(string, required)_
- **Body:** `content` _(string, required)_
- **200:** Ok

### POST /api/v2/system/mail/template/{template}/preview

Render email template preview.

- **Path params:** `template` _(string, required)_
- **Body:** `content` _(string, required)_, `variables` _(object, optional)_
- **200:** Ok

### POST /api/v2/system/mail/template/{template}/reset

Reset email template.

- **Path params:** `template` _(string, required)_
- **200:** Ok

## Mosaic

### POST /api/v1/mosaic

Change conference mosaic.

- Only for moderators
- **Body:** `conference` _(string, required)_, `mosaic` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

## Multitenancy

### GET /api/v2/tenants

Get tenants index.

- **Query params:** `limit` _(integer, optional)_, `offset` _(integer, optional)_, `search` _(string, optional)_
- **200:** Ok

### POST /api/v2/tenants

Create tenant.

- **Body:** `uuid` _(string, optional)_, `title` _(string, required)_, `numberPrefix` _(string, optional)_, `numberPoolSettings` _(object, optional)_, `permits` _(object, optional)_
- **204:** No content

### GET /api/v2/tenants/{tenant}

Get tenant settings.

- **Path params:** `tenant` _(string, required, uuid)_ — Tenant identity UUID
- **200:** Ok

### DELETE /api/v2/tenants/{tenant}

Delete tenant and all its resources.

- **Path params:** `tenant` _(string, required, uuid)_ — Tenant identity UUID
- **Query params:** `withVideoRecords` _(boolean, optional)_
- **204:** No content

### PATCH /api/v2/tenants/{tenant}

Update tenant.

- **Path params:** `tenant` _(string, required, uuid)_ — Tenant identity UUID
- **Body:** `uuid` _(string, optional)_, `title` _(string, optional)_, `numberPrefix` _(string, optional)_, `numberPoolSettings` _(object, optional)_, `permits` _(object, optional)_
- **204:** No content

## Network

### GET /api/v2/network/interfaces

List network interfaces.

- **200:** Ok

### GET /api/v2/network/routes

List persistent and system network routes mapped by definition.

- **200:** Ok

### POST /api/v2/network/routes

Create a persisted network route.

- If possible, it will be enabled
- **Body:** `interface` _(string, required)_, `networkPrefix` _(string, required)_, `subnetMask` _(number, required)_, `gateway` _(string, required)_
- **200:** Ok

### DELETE /api/v2/network/routes/{route}

Delete persisted network route.

- If possible, it will also be disabled
- **Path params:** `route` _(string, required)_
- **200:** Ok

### POST /api/v2/network/routes/{route}/enable

Enable persisted network route.

- Adds the route to the system IP routing table
- **Path params:** `route` _(string, required)_
- **Body:** Route object
- **200:** Ok

### POST /api/v2/network/routes/{route}/disable

Disable persisted network route.

- Removes the route from the system IP routing table
- **Path params:** `route` _(string, required)_
- **Body:** Route object
- **200:** Ok

## Oauth

### GET /api/v2/system/oauth/options

List available provider types and flow extensions.

- **200:** Ok

### GET /api/v2/system/oauth/providers

List all OAuth providers.

- **200:** Ok

### POST /api/v2/system/oauth/providers

Create OAuth provider.

- **Body:** `id` _(string, optional)_, `title` _(string, required)_, `clientId` _(string, required)_, `clientSecret` _(string, required)_, `type` _(string, required)_, `options` _(object, optional)_, `extensions` _(object, optional)_
- **200:** Ok

### GET /api/v2/system/oauth/provider/{provider}

Get OAuth provider settings.

- **Path params:** `provider` _(string, required)_
- **200:** Ok

### DELETE /api/v2/system/oauth/provider/{provider}

Delete OAuth provider.

- **Path params:** `provider` _(string, required)_
- **200:** Ok

### PATCH /api/v2/system/oauth/provider/{provider}

Update OAuth provider.

- **Path params:** `provider` _(string, required)_
- **Body:** `id` _(string, optional)_, `title` _(string, optional)_, `clientId` _(string, optional)_, `clientSecret` _(string, optional)_, `type` _(string, optional)_, `options` _(object, optional)_, `extensions` _(object, optional)_
- **200:** Ok

## Participant

### GET /api/v2/conferences/{conference}/connections/{connection}/settings

Get settings of an anonymous participant.

- **Path params:** `conference` _(string, required)_ — Conference number, `connection` _(string, required)_
- **200:** Ok

### PATCH /api/v2/conferences/{conference}/connections/{connection}/settings

Update settings of an anonymous participant.

- **Path params:** `conference` _(string, required)_ — Conference number, `connection` _(string, required)_
- **Body:** `watermark` _(string, optional)_, `ignore` _(string, optional)_, `inVolume` _(string, optional)_, `outVolume` _(string, optional)_, `allowSendH239` _(string, optional)_
- **204:** No content
- **404:** Participant not found
- **500:** Failed to update

### POST /api/v2/participants/self/disconnect

Disconnect current participant from the server.

- **204:** No content

## Participants

### POST /api/v1/participants

Add participants to conference.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array, required)_ — items include `number`, `txResolution`, `rxResolution`, `txBandwidth`, `rxBandwidth`, `txFPS`, `rxFPS`, `watermark`, `mic`, `camera`, `call`
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/call

Call participants to conference.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/participant/{conference}/{participant}

Get conference participant params.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_ — Participant number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### DELETE /api/v1/participant/{conference}/{participant}

Delete participant from conference.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_ — Participant number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **500:** Internal server error

### POST /api/v1/disable_audio

Disable participant audio.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/disable_camera

Disable participant camera.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/disable_mic

Disable participant microphone.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_, `notLecturer` _(boolean, optional)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/disable_pvp

Disable participant presentation.

- Only for moderators
- **Body:** `conference` _(number, required)_, `participant` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/disable_video

Disable participant video.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/disconnect

Disconnect participants.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/enable_audio

Enable participant audio.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/enable_camera

Enable participant camera.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/enable_mic

Enable participant microphone.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/enable_pvp

Enable participant presentation.

- Only for moderators
- **Body:** `conference` _(number, required)_, `participant` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/enable_video

Enable participant video.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/fast_call

Fast participant call by IP.

- Only for moderators
- **Body:** `conference` _(string, required)_, `number` _(string, required)_, `type` _(string, required)_, `resolution` _(string, optional)_, `speed` _(number, optional)_, `fps` _(number, optional)_, `watermark` _(string, optional)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data

### GET /api/v1/audio_channels/{conference}/{participant}

Get participant audio channels settings.

- For moderators, admins, and the participant himself
- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_ — Participant number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### PATCH /api/v1/audio_channels/{conference}/{participant}

Change participant audio channels settings.

- For moderators, admins, and the participant himself
- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_ — Participant number
- **Body:** `input` _(array[number], required)_, `output` _(array[number], required)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/participant/{conference}/{participant}/settings

Get participant settings.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_ — Participant number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### PATCH /api/v1/participant/{conference}/{participant}/settings

Change participant settings.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_ — Participant number
- **Body:** `txResolution` _(string, optional)_, `rxResolution` _(string, optional)_, `txBandwidth` _(number, optional)_, `rxBandwidth` _(number, optional)_, `txFPS` _(number, optional)_, `rxFPS` _(number, optional)_, `watermark` _(string, optional)_, `mic` _(boolean, optional)_, `camera` _(boolean, optional)_, `inVolume` _(number, optional)_, `outVolume` _(number, optional)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/participants/{conference}

Get conference participants list.

- Available for all who can read the conference
- **Path params:** `conference` _(string, required)_ — Conference number
- **Query params:** `filter` _(string, optional)_, `hidden` _(boolean, optional)_, `withScreenshots` _(boolean, optional)_, `search` _(string, optional)_, `limit` _(number, optional)_, `offset` _(number, optional)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### POST /api/v1/move

Move participants between conferences.

- Only for moderators
- **Body:** `conference` _(number, required)_, `participants` _(array, required)_ — items include `from` and `participant`, `addAsParticipants` _(boolean, optional)_, `saveSettings` _(boolean, optional)_, `hidden` _(boolean, optional)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/show_titer

Show titer to conference participant.

- Only for moderators
- **Body:** `conference` _(number, required)_, `participant` _(string, required)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data

### PATCH /api/v1/watermark/{conference}/{participant}

Change participant watermark.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number, `participant` _(string, required)_ — Participant number
- **Body:** `watermark` _(string, required)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/participants/show

Show participants in layout.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **406:** Not acceptable
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/participants/hide

Hide participants in layout.

- Only for moderators
- **Body:** `conference` _(string, required)_, `participants` _(array[string], required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **406:** Not acceptable
- **422:** Invalid JSON or request data
- **500:** Internal server error

## Participation

### GET /api/v2/participation/{conference}/availableConnections

Get available source connections for users in a conference.

- **Path params:** `conference` _(string, required)_ — Conference number
- **Query params:** `limit` _(integer, required)_, `offset` _(integer, required)_, `search` _(string, required)_, `group` _(string, required)_, `withoutGroup` _(boolean, required)_, `intersect` _(array[string], optional)_
- **200:** Ok

### GET /api/v2/participation/availableConnections

Get available source connections for users.

- **Query params:** `limit` _(integer, required)_, `offset` _(integer, required)_, `search` _(string, required)_, `group` _(string, required)_, `withoutGroup` _(boolean, required)_, `intersect` _(array[string], optional)_
- **200:** Ok

### GET /api/v2/participation/availableGroups

Get available groups.

- **200:** Ok

### POST /api/v2/participation/{conference}

Add participants to the conference.

- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** `groups` _(array[string], optional)_, `connections` _(array[string], optional)_
- **200:** Ok

### GET /api/v2/participation/conferences

Get list of conferences where the user is a participant or moderator.

- **200:** Ok

## PasswordPolicy

### POST /api/v2/security/policies/nmpfa

Enable “The user must set the password himself” for all users.

- Sets the corresponding property to `true` for all accounts and users
- **Body:** `unauthorize` _(boolean, required)_
- **200:** Success
- **404:** Already applied to all users
- **500:** Unsuccessful operation

## Presentation

### POST /api/v1/disable_presentation

Disable presentation in conference.

- Only for moderators
- **Body:** `conference` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/enable_presentation

Enable presentation in conference.

- Only for moderators
- **Body:** `conference` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

## Push

### POST /api/v2/push/call/{pushCall}/accept

Accept call.

- **Path params:** `pushCall` _(string, required, uuid)_ — Push call UUID
- **204:** No content

### POST /api/v2/push/call/{pushCall}/decline

Decline call.

- **Path params:** `pushCall` _(string, required, uuid)_ — Push call UUID
- **204:** No content

### GET /api/v2/push/personalTokens

List account push tokens.

- **200:** Ok

### POST /api/v2/push/token

Subscribe to push notifications.

- **Body:** `platform` _(number, required)_, `token` _(string, required)_
- **204:** No content

### POST /api/v2/push/logout

Unsubscribe from push notifications.

- **Body:** `platform` _(number, required)_, `token` _(string, required)_
- **204:** No content

## Recording

### POST /api/v1/start_recording

Start conference recording. `[public, legacy]`

- **Body:** `conference` _(number, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/stop_recording

Stop conference recording. `[public, legacy]`

- **Body:** `conference` _(number, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/recording/{conference}

Get conference recording settings. `[public, legacy]`

- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### PATCH /api/v1/recording/{conference}

Update conference recording settings. `[public, legacy]`

- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** `resolution` _(string, required)_, `bandwidth` _(number, required)_, `onlyAudio` _(boolean, required)_, `recordProtocols` _(boolean, required)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/records

Get recordings index. `[public, legacy]`

- **Query params:** `offset` _(integer, optional)_, `limit` _(integer, optional)_, `search` _(string, optional)_, `sort` _(string, optional)_, `direction` _(string, optional)_, `from` _(string, optional)_ — `YYYY-MM-DD`, `to` _(string, optional)_ — `YYYY-MM-DD`
- **200:** Ok

### DELETE /api/v1/record/{recording}

Delete recording and derivative files. `[public, legacy]`

- **Path params:** `recording` _(integer, required)_ — Recording ID
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **500:** Internal server error

### GET /api/v2/recordings/{recording}

Get recording data.

- **Path params:** `recording` _(integer, required)_ — Recording ID
- **200:** Ok

### POST /api/v2/recordings/bulkDelete

Delete recordings and derivative files.

- **Body:** `recordings` _(array[number], required)_
- **204:** No content

## RecordingConversions

### GET /api/v2/recordings/{recording}/conversions

List current recording file conversions.

- **Path params:** `recording` _(integer, required)_ — Recording ID
- **200:** Ok

### POST /api/v2/recordings/{recording}/conversions

Convert recording source file to another format.

- **Path params:** `recording` _(integer, required)_ — Recording ID
- **Body:** `format` _(string, required)_
- **204:** No content

### DELETE /api/v2/recordingConversions/{conversion}

Delete recording conversion.

- **Path params:** `conversion` _(integer, required)_ — Converted record file ID
- **204:** No content

## RecordingProtocols

### GET /api/v2/recordings/{recording}/protocols

List related recording protocols.

- Returns `403` if this feature is not enabled
- **Path params:** `recording` _(integer, required)_ — Recording ID
- **Query params:** `offset` _(integer, optional)_, `limit` _(integer, optional)_, `search` _(string, optional)_
- **200:** Ok
- **403:** Access denied

## SBC

### GET /api/v2/system/settings/sbc

Get SBC settings.

- **200:** Ok

### PUT /api/v2/system/settings/sbc

Save SBC settings.

- **Body:** `enabled` _(boolean, required)_, `serverUuid` _(string, required)_, `serverRole` _(string, required)_, `externalApiKey` _(string, required)_, `serverIp` _(string, required)_, `externalServerUuid` _(string, required)_
- **200:** Ok

## Schedules

### POST /api/v1/schedule_temporary_conference

Schedule temporary conference.

- Creates a temporary conference on the specified date
- **Body:** `description` _(string, required)_, `date` _(number, required)_, `duration` _(number, required)_, `call` _(boolean, optional)_, `notification` _(boolean, optional)_, `organizer` _(string, optional)_, `participants` _(array[string], optional)_, `record` _(boolean, optional)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/schedules

Get scheduled conferences list.

- For all authenticated users
- **Query params:** `offset` _(number, optional)_, `limit` _(number, optional)_, `sort` _(string, optional)_, `direction` _(string, optional)_, `search` _(string, optional)_
- **200:** Ok

### POST /api/v1/schedules

Schedule conference.

- Only for moderators
- **Body:** `conference` _(string, required)_, `schedules` _(array, required)_ — items include `date`, `duration`, `call`, `notification`, `organizer`, `record`
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/delete_schedules

Delete schedules.

- For all authenticated users
- **Body:** `id` _(array[number], required)_
- **201:** Created
- **422:** Invalid JSON or request data
- **500:** Internal server error

### PUT /api/v1/schedules/{conference}/{schedule}

Update conference schedule.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number, `schedule` _(string, required)_ — Schedule number
- **Body:** `date` _(number, required)_, `duration` _(number, required)_, `call` _(boolean, optional)_, `notification` _(boolean, optional)_, `organizer` _(string, optional)_, `record` _(string, optional)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

## Spectators

### PATCH /api/v2/spectators/{conference}

Move channels to spectators or participants.

- Returns `403` if this feature is not enabled
- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** `channels` _(array[string], required)_, `makeSpectators` _(boolean, required)_, `notLecturer` _(boolean, optional)_
- **200:** Ok

## System

### GET /api/v1/version

Get current server API version. `[public, legacy]`

- **200:** Ok

### GET /api/v2/version

Get current API version.

- **200:** Ok

## Users

### GET /api/v2/users

List users.

- **Query params:** `search` _(string, optional)_, `limit` _(integer, optional)_, `offset` _(integer, optional)_
- **200:** Ok

### POST /api/v2/users

Create a new user.

- **Body:** `identity` _(string, required)_, `description` _(string, optional)_, `password` _(string, required)_, `isSuperAdmin` _(boolean, optional)_, `role` _(string, optional)_, `locked` _(boolean, optional)_, `tenantUuid` _(string, optional)_, `passwordChange` _(boolean, optional)_, `forbidAuthAPI` _(boolean, optional)_, `forbidReauthorization` _(boolean, optional)_
- **204:** No content

### GET /api/v2/users/{user}

Get user information.

- **Path params:** `user` _(string, required)_ — Username
- **200:** Ok

### DELETE /api/v2/users/{user}

Delete a user.

- Last SuperAdmin cannot be deleted
- **Path params:** `user` _(string, required)_ — Username
- **204:** No content

### PATCH /api/v2/users/{user}

Update user.

- At least one user must remain a SuperAdmin
- **Path params:** `user` _(string, required)_ — Username
- **Body:** `description` _(string, optional)_, `password` _(string, optional)_, `isSuperAdmin` _(boolean, optional)_, `role` _(string, optional)_, `locked` _(boolean, optional)_, `passwordChange` _(boolean, optional)_, `forbidAuthAPI` _(boolean, optional)_, `forbidReauthorization` _(boolean, optional)_
- **204:** No content

## Video

### GET /api/v1/players

Get list of available videos.

- **200:** Ok

### POST /api/v1/players

Add media player participant.

- **Body:** `conference` _(string, required)_, `video` _(number, required)_, `loop` _(boolean, optional)_
- **201:** Created

### POST /api/v2/system/video

Add video.

- **Body:** `title` _(string, required)_, `description` _(string, optional)_
- **201:** Created

### DELETE /api/v2/system/video/{video}

Delete video.

- **Path params:** `video` _(integer, required)_ — Video ID
- **204:** No content

### PATCH /api/v2/system/video/{video}

Update video.

- **Path params:** `video` _(integer, required)_ — Video ID
- **Body:** `title` _(string, optional)_, `description` _(string, optional)_
- **200:** Ok

### POST /api/v2/system/video/{video}/upload

Upload file for video.

- **Path params:** `video` _(integer, required)_ — Video ID
- **Body:** `file` _(multipart/form-data, required)_ — Supported formats: `mp4`, `avi`, `flv`, `mov`, `m4v`, `wmv`, `mkv`; maximum size: `512MB`
- **202:** Accepted

## Webcast

### POST /api/v1/disable_webcast

Disable conference webcast.

- Only for moderators
- **Body:** `conference` _(string, required)_
- **201:** Created
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v1/enable_webcast

Enable conference webcast.

- Only for moderators
- **Body:** `conference` _(string, required)_
- **200:** Webcast already active
- **201:** Webcast started
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### GET /api/v1/stream/{token}

Get webcast params by token.

- Available for all
- **Path params:** `token` _(string, required)_ — Webcast token
- **200:** Ok

### GET /api/v1/streams

Get webcasts list.

- For all authenticated users
- **200:** Ok

### GET /api/v1/webcast/{conference}

Get webcast settings.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found

### PATCH /api/v1/webcast/{conference}

Change webcast settings.

- Only for moderators
- **Path params:** `conference` _(string, required)_ — Conference number
- **Body:** `mosaic` _(string, optional)_, `resolution` _(string, optional)_, `bandwidth` _(number, optional)_, `hls` _(boolean, optional)_, `youtubeResolution` _(string, optional)_, `youtubeBandwidth` _(number, optional)_, `youtubeIP` _(string, optional)_, `youtubeKey` _(string, optional)_, `youtube` _(boolean, optional)_, `password` _(string, optional)_, `chat` _(boolean, optional)_, `cleaningChat` _(boolean, optional)_, `manual` _(boolean, optional)_, `manualResolution` _(string, optional)_, `manualBandwidth` _(number, optional)_, `manualFormat` _(string, optional)_, `manualUrl` _(string, optional)_, `hlsAbs` _(boolean, optional)_, `hlsTime` _(number, optional)_, `hlsListSize` _(number, optional)_
- **200:** Ok
- **403:** Access denied
- **404:** Entity not found
- **422:** Invalid JSON or request data
- **500:** Internal server error

### POST /api/v2/webcast/{conference}/status

Update registered webcast viewer status.

- Returns info about participation redirects
- **Path params:** `conference` _(string, required)_ — Conference number
- **200:** Ok

### PUT /api/v2/webcast/{conference}/move/{account}

Move account from conference call to its webcast.

- **Path params:** `conference` _(string, required)_ — Conference number, `account` _(string, required)_ — Account number
- **200:** Ok

## Webhooks

### GET /api/v2/webhooks/daemon

Poll daemon status and client statistics.

- **200:** Ok

### POST /api/v2/webhooks/daemon/stop

Force webhook daemon to stop.

- Expected to restart automatically
- **200:** Ok

### POST /api/v2/webhooks/daemon/reload

Reload webhook daemon configuration.

- Use if client settings failed to apply and need manual reload
- **200:** Ok

### GET /api/v2/webhooks/events

Get last streamed events.

- **200:** Ok

### GET /api/v2/webhooks/events/types

List available event types.

- **200:** Ok

### POST /api/v2/webhooks/events/truncate

Truncate webhook event stream.

- **Body:** `upToTimestamp` _(number, required)_
- **200:** Ok

### GET /api/v2/webhooks/subscribers

List all webhook subscribers.

- **200:** Ok

### POST /api/v2/webhooks/subscribers

Create webhook subscriber.

- **Body:** `url` _(string, required)_, `subscriptions` _(array[string], required)_, `authType` _(string, optional)_, `authToken` _(string, optional)_
- **200:** Ok

### GET /api/v2/webhooks/subscribers/{subscriber}

Get webhook subscriber settings.

- **Path params:** `subscriber` _(string, required)_
- **200:** Ok

### DELETE /api/v2/webhooks/subscribers/{subscriber}

Delete webhook subscriber.

- **Path params:** `subscriber` _(string, required)_
- **200:** Ok

### PATCH /api/v2/webhooks/subscribers/{subscriber}

Update webhook subscriber.

- **Path params:** `subscriber` _(string, required)_
- **Body:** Subscriber object
- **200:** Ok

### POST /api/v2/webhooks/subscribers/{subscriber}/disable

Disable webhook subscriber.

- Disabled subscriber is removed from daemon job queue but keeps its event tail
- **Path params:** `subscriber` _(string, required)_
- **Body:** Subscriber object
- **200:** Ok

### POST /api/v2/webhooks/subscribers/{subscriber}/enable

Enable webhook subscriber.

- If the subscriber already received events, pushing continues from its existing tail
- **Path params:** `subscriber` _(string, required)_
- **Body:** Subscriber object
- **200:** Ok

### POST /api/v2/webhooks/subscribers/{subscriber}/reset

Reset webhook subscriber tail.

- Enables subscriber and resets its event tail to start again from a recent point
- **Path params:** `subscriber` _(string, required)_
- **Body:** Subscriber object
- **200:** Ok

### POST /api/v2/webhooks/subscribers/{subscriber}/ping

Test webhook subscriber.

- Sends a test `ping` event to the subscriber URL using current settings
- **Path params:** `subscriber` _(string, required)_
- **Body:** Subscriber object
- **200:** Ok

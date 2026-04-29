# Email Template Example

## Open Tracking Pixel
Insert at end of email body:
```html
<img src="https://yourdomain.com/api/track/open?campaign_id={{campaign_id}}&contact_id={{contact_id}}" width="1" height="1" alt="" style="display:none;">
```

## Click Tracking
```html
<a href="https://yourdomain.com/api/track/click?campaign_id={{campaign_id}}&contact_id={{contact_id}}&url=https%3A%2F%2Fexample.com">Click here</a>
```

## Unsubscribe Link
```html
<a href="https://yourdomain.com/api/unsubscribe?email={{email}}&token={{suppression_token}}">Unsubscribe</a>
```

## Template with Merge Tags
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <h1>Hi {{first_name}},</h1>
  <p>Thanks for subscribing!</p>
  <p>Latest updates:</p>
  <p>Best regards,<br>The Team</p>
  
  <!-- TRACKING PIXEL -->
  <img src="https://yourdomain.com/api/track/open?campaign_id={{campaign_id}}&contact_id={{contact_id}}" width="1" height="1" alt="" style="display:none;">
  
  <p><a href="https://yourdomain.com/api/unsubscribe?email={{email}}&token={{suppression_token}}">Unsubscribe</a></p>
</body>
</html>
```

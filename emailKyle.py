from email.mime.text import MIMEText
import requests
import smtplib

data = requests.get('http://knoydart.modulo.ee/api/v0/readings/pages/?page=hourMoney').text

msg = MIMEText(data)

me = 'dataTaker@knoydart.org'
you ='margus.lind@gmail.com'
subj = 'Summary of last month'

msg['Subject'] = subj
msg['From'] = me
msg['To'] = you


smtpserver = smtplib.SMTP("localhost", 25)
header = 'To:' + you + '\n' + 'From:' + me + '\n' + 'Subject: ' + subj +'\n'
msg = header + '\n' + data
smtpserver.sendmail(me, you, msg)
smtpserver.close()
# Send the message via our own SMTP server, but don't include the
# # envelope header.
# s = smtplib.SMTP('localhost', 25)
# s.sendmail(me, [you], msg.as_string())
# s.quit()
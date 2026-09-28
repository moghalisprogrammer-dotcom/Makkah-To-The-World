from pathlib import Path
from urllib.request import urlopen, urlretrieve
import re
p = Path('public/images')
p.mkdir(parents=True, exist_ok=True)
urlretrieve('https://images.unsplash.com/photo-1643892151836-07fe5562d0f2?auto=format&fit=crop&w=1920&q=85', p/'alula.jpg')
urlretrieve('https://images.unsplash.com/photo-1741888019564-3e9d8fe95efb?auto=format&fit=crop&w=1000&q=80', p/'jeddah.jpg')
print('Downloaded local tourism images.')

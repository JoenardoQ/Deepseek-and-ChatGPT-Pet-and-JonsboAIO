import base64
import io
from pathlib import Path
import sys
import unittest
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'desktop'))
from frame_worker import FrameInput, decode_frame

def png():
    im=Image.new('RGB',(480,480),'blue')
    im.putpixel((0,0),(255,0,0))
    out=io.BytesIO();im.save(out,format='PNG')
    return base64.b64encode(out.getvalue()).decode()

class FrameInputTests(unittest.TestCase):
    def test_live_heartbeat_holds_frame_but_disconnect_releases(self):
        feed=FrameInput();feed.update({'enabled':True,'png':png()},480,480,90,0)
        frame=feed.frame
        for second in range(1,16):
            feed.update({'enabled':True},480,480,90,second)
            self.assertTrue(feed.active(second))
            self.assertIs(feed.frame,frame)
        feed.update({'enabled':False},480,480,90,16)
        self.assertFalse(feed.active(16));self.assertIsNone(feed.frame)
        feed.update({'enabled':True},480,480,90,17)
        self.assertFalse(feed.active(17))

    def test_dead_bridge_times_out_and_entire_frame_rotates_clockwise(self):
        feed=FrameInput();feed.update({'png':png()},480,480,90,0)
        self.assertTrue(feed.active(7));self.assertFalse(feed.active(9))
        self.assertEqual(feed.frame.getpixel((479,0)),(255,0,0))
        with self.assertRaises(ValueError):feed.update({'enabled':'false'},480,480,90,1)

    def test_coalesced_off_on_still_requests_reconnect(self):
        feed=FrameInput()
        feed.update({'enabled':True,'png':png(),'generation':1,'streamId':'dsh:a'},480,480,90,0)
        # Queue drops intermediate off; the later generation must still release the SDK.
        self.assertTrue(feed.update({'enabled':True,'png':png(),'generation':3,'streamId':'dsh:a'},480,480,90,1))
        self.assertTrue(feed.active(1))
        self.assertFalse(feed.update({'enabled':True,'generation':3,'streamId':'dsh:a'},480,480,90,2))

    def test_handoff_cannot_reuse_another_pets_frame(self):
        feed=FrameInput()
        feed.update({'enabled':True,'png':png(),'streamId':'dsh:a'},480,480,90,0)
        self.assertTrue(feed.update({'enabled':True,'streamId':'dsh:b'},480,480,90,1))
        self.assertIsNone(feed.frame)
        self.assertFalse(feed.active(1))
        feed.update({'enabled':True,'png':png(),'streamId':'dsh:b'},480,480,180,2)
        self.assertEqual(feed.frame.getpixel((479,479)),(255,0,0))

if __name__=='__main__':unittest.main()

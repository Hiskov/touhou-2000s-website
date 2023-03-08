#/bin/sh

ffmpeg -an -i OR/BASS.mp4 -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 BASS.mp4;
ffmpeg -an -i OR/CIRNO.mp4 -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 CIRNO.mp4;
ffmpeg -an -i "OR/HI HAT.mp4" -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 "HI HAT.mp4";
ffmpeg -an -i OR/KICK.mp4 -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 KICK.mp4;
ffmpeg -an -i "OR/SNARE.mp4" -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 "SNARE.mp4";
ffmpeg -an -i "OR/SNARE 2.mp4" -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 "SNARE 2.mp4";
ffmpeg -an -i "OR/STRINGS 1.mp4" -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 "STRINGS 1.mp4";
ffmpeg -an -i "OR/STRINGS 2.mp4" -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 "STRINGS 2.mp4";
ffmpeg -an -i "OR/STRINGS 3.mp4" -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 "STRINGS 3.mp4";
ffmpeg -an -i "OR/SYNTH ECHO.mp4" -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 "SYNTH ECHO.mp4";
ffmpeg -an -i OR/SYNTH.mp4 -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 "SYNTH.mp4";
ffmpeg -an -i OR/TELEPHONE.mp4 -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 "TELEPHONE.mp4";

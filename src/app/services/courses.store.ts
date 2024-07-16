import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { Course, sortCoursesBySeqNo } from "../model/course";
import { catchError, map, shareReplay, tap } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { LoadingService } from "../loading/loading.service";
import { MessagesService } from "../messages/messages.service";

@Injectable({
    providedIn: 'root'
}) 
export class CoursesStore {

    private subject = new BehaviorSubject<Course[]>([]);
    courses$: Observable<Course[]> = this.subject.asObservable();

    constructor(private http: HttpClient,
        private loadingService: LoadingService,
        private messagesService: MessagesService 
    ){
        this.loadAllCourses();

    }

    private loadAllCourses() {
        const loadCourse$ = this.http.get<Course[]>(`/api/courses`)
            .pipe(
                map(resp => resp["payload"]),
                catchError(error => {
                    const message = "Couldn't load courses";
                    this.messagesService.showErrors(message);
                    console.log(message, error);
                    return throwError(error);
                }),
                tap((courses) => this.subject.next(courses))
            );

        this.loadingService.showLoaderUntilCompleted(loadCourse$)
            .subscribe();
    }

    saveCourse(courseId: string, changes: Partial<Course>): Observable<any> {

        const courses = this.subject.getValue();

        const courseIndex = courses.findIndex(course => course.id == courseId);

        const newCourse: Course = {
            ...courses[courseIndex],
            ...changes
        }

        const newCourses: Course[] = courses.slice(0); 
        newCourses[courseIndex] = newCourse;

        this.subject.next(newCourses);

        return this.http.put(`/api/courses/${courseId}`, changes)
            .pipe(
                catchError(error => {
                    const message = "Couldn't save course";
                    console.log(message, error);
                    this.messagesService.showErrors(message);
                    return throwError(error);
                }),
                shareReplay()
            )
    }


    filterByCategory(category: string): Observable<Course[]> {

        return this.courses$.pipe(
                map(courses => 
                    courses.filter(course => course.category == category)
                        .sort(sortCoursesBySeqNo)
                )
            )

    }

}